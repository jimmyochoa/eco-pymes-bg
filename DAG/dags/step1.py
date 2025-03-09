import json
from concurrent.futures import ThreadPoolExecutor

from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
import os
import logging
import requests
from kafka import KafkaProducer

# For fuzzy matching
from fuzzywuzzy import fuzz

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

logger = logging.getLogger(__name__)

API_URL = os.getenv("API_URL", "")
API_KEY = os.getenv("API_KEY")

APIS = {
    "persona": f"{API_URL}/Hackathon/persona",
    "auto": f"{API_URL}/Hackathon/auto",
    "establecimiento": f"{API_URL}/Hackathon/establecimiento",
    "salario": f"{API_URL}/Hackathon/salario",
    "scoreburo": f"{API_URL}/Hackathon/scoreburo",
    "supercia": f"{API_URL}/Hackathon/supercia"
}

NEGATIVE_INDEX = ["scoreburo", "supercia"]


def _get_data_from_api(key, params=None):
    headers = {
        "accept": "*/*",
        "HCK-API-Key": API_KEY
    }
    response = requests.get(APIS[key], headers=headers, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        return None


def _fetch_endpoint_data(key):
    """Fetch data from an endpoint. Replace simulated response with real API calls as needed."""
    try:
        data = _get_data_from_api(key)
        # Add the source to every record.
        for record in data:
            record["source"] = key
        logger.info("Fetched data from %s: %s", APIS[key], data)
        return data
    except Exception as e:
        logger.error("Error fetching from %s: %s", APIS[key], e)
        return []


# ---------------------------
# Task 1: Fetch and merge data with tuning
# ---------------------------
def fetch_from_apis(**kwargs):
    with ThreadPoolExecutor(max_workers=6) as executor:
        data_list = list(executor.map(_fetch_endpoint_data, APIS.keys()))
    logger.info("Fetched data: %s", data_list)
    return data_list


def _add_record_to_merged(merged, record, threshold=90):
    """
    Add a record to the merged dictionary.
    Uses fuzzy matching on the 'cedula' field.
    """
    id = record.get("cedula")
    if not id:
        # Skip record if 'cedula' is missing or empty.
        return
    # Look for an existing cedula key that is similar.
    found_key = None
    for key in merged.keys():
        if fuzz.ratio(id, key) >= threshold:
            found_key = key
            break
    if found_key:
        merged[found_key].append(record)
    else:
        merged[id] = [record]


# ---------------------------
# Task 2: Fetch and merge data with tuning
# ---------------------------
def merge_data_by_id(**kwargs):
    """
    Merge records from multiple endpoints by 'cedula' using fuzzy matching.
    The result is a dictionary mapping each cedula to a list of attribute records.
    """
    ti = kwargs['ti']
    data_list = ti.xcom_pull(task_ids='fetch_from_apis')
    if not data_list:
        logger.error("No data lists found.")
        return

    merged = {}
    for dataset in data_list:
        for record in dataset:
            _add_record_to_merged(merged, record)
    logger.info("Merged data: %s", merged)

    # Publish merged data to Kafka topic "merged_data"
    producer = KafkaProducer(
        bootstrap_servers='kafka:9092',
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )
    producer.send('merged_data', merged)
    producer.flush()
    producer.close()

    return merged


with DAG(
        dag_id='fetch_and_merge_from_apis',
        default_args=default_args,
        description='A DAG to fetch data, generate a graph DB, compute embeddings, and update a Pinecone index',
        schedule_interval='@hourly',
        start_date=datetime(2025, 3, 8),
        catchup=False
) as dag:
    task_fetch_from_api = PythonOperator(
        task_id='fetch_from_apis',
        python_callable=fetch_from_apis,
        provide_context=True,
    )

    task_merge_data_by_id = PythonOperator(
        task_id='merge_data_by_id',
        python_callable=merge_data_by_id,
        provide_context=True,
    )
    task_fetch_from_api >> task_merge_data_by_id
