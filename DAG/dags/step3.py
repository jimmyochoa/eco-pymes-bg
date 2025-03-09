import json

from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
import logging
from sentence_transformers import SentenceTransformer
from kafka import KafkaConsumer, KafkaProducer

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

logger = logging.getLogger(__name__)

# ---------------------------
# Step 3: Generate semantic embeddings (unchanged)
# ---------------------------
def generate_semantic_embeddings(**kwargs):
    """
    For each cedula, concatenate its records (ignoring cedula and source) into a single string,
    and compute a semantic embedding using a pre-trained model.
    """
    consumer = KafkaConsumer(
        'merged_data',
        bootstrap_servers='kafka:9092',
        auto_offset_reset='earliest',
        enable_auto_commit=True,
        group_id='group_compute_semantic',
        value_deserializer=lambda m: json.loads(m.decode('utf-8'))
    )
    merged_data = None
    for message in consumer:
        merged_data = message.value
        break
    consumer.close()
    if not merged_data:
        logger.error("No merged data received for semantic embeddings")
        return

    model = SentenceTransformer('all-MiniLM-L6-v2')
    semantic_embeddings = {}
    for cedula, records in merged_data.items():
        texts = []
        for record in records:
            # Convert each record's attributes to a string
            text = " ".join(f"{k}:{v}" for k, v in record.items() if k not in ["cedula", "source"])
            texts.append(text)
        combined_text = " ".join(texts)
        embedding = model.encode(combined_text)
        semantic_embeddings[cedula] = embedding.tolist()  # Convert to list for JSON compatibility
        logger.info("Computed semantic embedding for cedula %s", cedula)

    producer = KafkaProducer(
        bootstrap_servers='kafka:9092',
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )
    producer.send('semantic_embeddings', semantic_embeddings)
    producer.flush()
    producer.close()

    return semantic_embeddings


with DAG(
        dag_id='dag_compute_semantic',
        default_args=default_args,
        description='A DAG to fetch data, generate a graph DB, compute embeddings, and update a Pinecone index',
        schedule_interval='@hourly',
        start_date=datetime(2025, 3, 8),
        catchup=False
) as dag:

    task_compute_semantic = PythonOperator(
        task_id='generate_semantic_embeddings',
        python_callable=generate_semantic_embeddings,
        provide_context=True,
    )
