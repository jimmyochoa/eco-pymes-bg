import json
from concurrent.futures import ThreadPoolExecutor

from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
import os
import networkx as nx
import logging
from neo4j import GraphDatabase

from kafka import KafkaConsumer, KafkaProducer

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

logger = logging.getLogger(__name__)


# ---------------------------
# Task 4: Aggregate Graph and Semantic Embeddings
# ---------------------------
def aggregate_embeddings(**kwargs):
    """
    For each cedula, compute a graph embedding (via eigenvector centrality) from Neo4j
    and concatenate it with the semantic embedding.
    """
    # Consume semantic embeddings from Kafka
    consumer_sem = KafkaConsumer(
        'semantic_embeddings',
        bootstrap_servers='kafka:9092',
        auto_offset_reset='earliest',
        enable_auto_commit=True,
        group_id='group_aggregate',
        value_deserializer=lambda m: json.loads(m.decode('utf-8'))
    )
    semantic_embeddings = None
    for message in consumer_sem:
        semantic_embeddings = message.value
        break
    consumer_sem.close()
    if not semantic_embeddings:
        logger.error("No semantic embeddings received")
        return

    # Get cedulas from Neo4j (graph should already be persisted)
    NEO4J_URI = os.getenv("NEO4J_URI", "bolt://neo4j:7687")
    NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "secret")
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    aggregated_embeddings = {}
    with driver.session() as session:
        result = session.run("MATCH (p:Person) RETURN p.id AS cedula")
        cedulas = [record["cedula"] for record in result]
    driver.close()

    for cedula in cedulas:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        G = nx.Graph()
        with driver.session() as session:
            G.add_node(cedula)
            query = """
            MATCH (p:Person {id:$cedula})-[r:HAS_ATTRIBUTE]->(a:Attribute)
            RETURN a.id AS attr_id, r.weight AS weight
            """
            result = session.run(query, cedula=cedula)
            for record in result:
                attr_id = record["attr_id"]
                weight = record["weight"]
                G.add_node(attr_id)
                G.add_edge(cedula, attr_id, weight=weight)
        driver.close()
        try:
            centrality = nx.eigenvector_centrality(G, weight='weight')
        except Exception as e:
            logger.error("Error computing graph embedding for cedula %s: %s", cedula, e)
            centrality = {}
        graph_embedding = centrality.get(cedula, 0.0)
        semantic_embedding = semantic_embeddings.get(cedula, [])
        # Aggregate by concatenating the semantic embedding with the graph embedding (as one extra dimension)
        aggregated = semantic_embedding + [float(graph_embedding)]
        aggregated_embeddings[cedula] = aggregated
        logger.info("Aggregated embedding for cedula %s", cedula)

    # Publish aggregated embeddings to Kafka topic "aggregated_embeddings"
    producer = KafkaProducer(
        bootstrap_servers='kafka:9092',
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )
    producer.send('aggregated_embeddings', aggregated_embeddings)
    producer.flush()
    producer.close()


with DAG(
        dag_id='dag_aggregate_embeddings',
        default_args=default_args,
        description='A DAG to fetch data, generate a graph DB, compute embeddings, and update a Pinecone index',
        schedule_interval='@hourly',
        start_date=datetime(2025, 3, 8),
        catchup=False
) as dag:
    task_aggregate = PythonOperator(
        task_id='aggregate_embeddings',
        python_callable=aggregate_embeddings,
        provide_context=True,
    )
