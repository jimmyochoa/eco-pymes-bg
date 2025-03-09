import json
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
import os
import networkx as nx
import logging
from neo4j import GraphDatabase
import pinecone

from kafka import KafkaConsumer, KafkaProducer
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

NEGATIVE_INDEX = ["scoreburo", "supercia"]


# ---------------------------
# Step 2: Generate and persist graph DB in Neo4j with tuned construction
# ---------------------------
def _persist_cedula_graph(tx, cedula, records):
    """
    Persist a subgraph for a given cedula.
    - Creates a main Person node.
    - For each record in the list (from different endpoints), create separate Attribute nodes
      for each attribute (if the attribute value is valid) and connect them with a weight.
    Weight is set to -1 for sources in negative index, otherwise 1.
    """
    logger.info("Persisting graph for cedula %s", cedula)
    tx.run("MERGE (p:Person {id:$cedula})", cedula=cedula)
    for record in records:
        source = record.get("source", "unknown")
        for key, value in record.items():
            if key in ["cedula", "source"]:
                continue
            # Handle missing or empty values by skipping
            if value is None or (isinstance(value, str) and not value.strip()):
                continue
            # Determine edge weight
            weight = -1 if source in NEGATIVE_INDEX else 1
            # Create a unique attribute node id to ensure node granularity
            node_id = f"{cedula}_{key}_{value}_{source}"
            logger.info("Persisting attribute %s with weight %s", node_id, weight)
            tx.run(
                """
                MERGE (a:Attribute {id: $node_id})
                ON CREATE SET a.name = $key, a.value = $value, a.source = $source
                WITH a
                MATCH (p:Person {id: $cedula})
                MERGE (p)-[r:HAS_ATTRIBUTE]->(a)
                SET r.weight = $weight
                """,
                node_id=node_id, key=key, value=value, source=source, cedula=cedula, weight=weight
            )


def generate_graph_db(**kwargs):
    # Consume merged data from Kafka topic "merged_data"
    consumer = KafkaConsumer(
        'merged_data',
        bootstrap_servers='kafka:9092',
        auto_offset_reset='earliest',
        enable_auto_commit=True,
        group_id='group_generate_graph',
        value_deserializer=lambda m: json.loads(m.decode('utf-8'))
    )
    merged_data = None
    for message in consumer:
        merged_data = message.value
        break  # Process the first available message
    consumer.close()
    if not merged_data:
        logger.error("No merged data received from Kafka")
        return

    # Connect to Neo4j using environment variables
    NEO4J_URI = os.getenv("NEO4J_URI", "bolt://neo4j:7687")
    NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "test")
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

    with driver.session() as session:
        for cedula, records in merged_data.items():
            session.write_transaction(_persist_cedula_graph, cedula, records)
            logger.info("Persisted graph for cedula %s", cedula)
    driver.close()

    logger.info("Graph DB generated and persisted to Neo4j.")

    # Publish status message to Kafka topic "graph_db_generated"
    producer = KafkaProducer(
        bootstrap_servers='kafka:9092',
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )
    producer.send('graph_db_generated', {"status": "success"})
    logger.info("Published status message to Kafka topic 'graph_db_generated'")
    producer.flush()
    producer.close()


default_args = {
    'owner': 'airflow',
    'start_date': datetime(2025, 3, 8),
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
        dag_id='dag_generate_graph',
        default_args=default_args,
        description='A DAG to fetch data, generate a graph DB, compute embeddings, and update a Pinecone index',
        schedule_interval='@hourly',
        start_date=datetime(2025, 3, 8),
        catchup=False
) as dag:
    task_generate_graph = PythonOperator(
        task_id='generate_graph_db',
        python_callable=generate_graph_db,
        provide_context=True,
    )
