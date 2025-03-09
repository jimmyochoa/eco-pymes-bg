import json
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
import os
import logging
import pinecone
from kafka import KafkaConsumer, KafkaProducer

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

logger = logging.getLogger(__name__)


# ---------------------------
# Task 5: Submit Aggregated Embeddings to Pinecone with Metadata
# ---------------------------
def submit_to_pinecone(**kwargs):
    consumer = KafkaConsumer(
        'aggregated_embeddings',
        bootstrap_servers='kafka:9092',
        auto_offset_reset='earliest',
        enable_auto_commit=True,
        group_id='group_submit',
        value_deserializer=lambda m: json.loads(m.decode('utf-8'))
    )
    aggregated_embeddings = None
    for message in consumer:
        aggregated_embeddings = message.value
        break
    consumer.close()
    if not aggregated_embeddings:
        logger.error("No aggregated embeddings received")
        return

    # Consume original merged data from Kafka topic "merged_data"
    consumer_merged = KafkaConsumer(
        'merged_data',
        bootstrap_servers='kafka:9092',
        auto_offset_reset='earliest',
        enable_auto_commit=True,
        group_id='group_submit_merged',
        value_deserializer=lambda m: json.loads(m.decode('utf-8'))
    )
    merged_data = None
    for message in consumer_merged:
        merged_data = message.value
        break
    consumer_merged.close()
    if not merged_data:
        logger.error("No merged data received")
        return

    PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "your-pinecone-api-key")
    PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT", "your-pinecone-env")
    PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "graph-embeddings")
    pinecone.init(api_key=PINECONE_API_KEY, environment=PINECONE_ENVIRONMENT)
    index = pinecone.Index(PINECONE_INDEX_NAME)

    vectors = []
    for cedula, agg_emb in aggregated_embeddings.items():
        # Use merged API data as metadata; here we store it as-is (ensure it's serializable)
        metadata = {"cedula": cedula, "api_data": merged_data.get(cedula, [])}
        vectors.append((cedula, agg_emb, metadata))

    index.upsert(vectors=vectors)
    logger.info("Submitted aggregated embeddings to Pinecone.")


with DAG(
        dag_id='dag_submit_to_pinecone',
        default_args=default_args,
        description='A DAG to fetch data, generate a graph DB, compute embeddings, and update a Pinecone index',
        schedule_interval='@hourly',
        start_date=datetime(2025, 3, 8),
        catchup=False
) as dag:
    task_submit = PythonOperator(
        task_id='submit_to_pinecone',
        python_callable=submit_to_pinecone,
        provide_context=True,
    )
