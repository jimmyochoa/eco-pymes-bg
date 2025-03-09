# Credit Evaluation RAG System

This project implements a multi-step pipeline for credit evaluation using data from multiple APIs. The solution integrates:

- **Airflow** for orchestrating data pipelines (split across multiple DAGs).
- **Kafka** as a messaging bus for inter-DAG communication.
- **PostgreSQL** as the metadata database for Airflow.
- **Neo4j** as a graph database to persist merged API data.
- **Pinecone** to store aggregated vector embeddings.
- **FastAPI** to expose a Retrieval-Augmented Generation (RAG) endpoint that leverages an LLM (via OpenAI API) for credit evaluation.

The pipeline consists of the following steps:

1. **Data Fetch & Merge:** Retrieve data from six endpoints and merge records by the common key `cedula` using fuzzy matching. The merged data is published to a Kafka topic.
2. **Graph Generation:** Consume the merged data from Kafka and build a graph in Neo4j. Relationships are weighted (–1 for data from APIs 5 and 6, 1 otherwise).
3. **Semantic Embedding:** Compute semantic embeddings for each candidate using a SentenceTransformer model and publish the results to Kafka.
4. **Aggregate Embeddings:** Combine graph embeddings (computed via eigenvector centrality from Neo4j) with the semantic embeddings and publish the aggregated vectors.
5. **Pinecone Submission:** Consume both the aggregated embeddings and the original merged data (as context) from Kafka, then upsert them to a Pinecone index as metadata.
6. **RAG Credit Evaluation:** A FastAPI endpoint accepts a candidate ID, retrieves the corresponding aggregated embeddings from Pinecone, constructs a prompt for an LLM to act as a credit evaluator, and returns a credit score and explanation.

---

## Folder Structure

project/ 
├── dags/
│├── dag_fetch_merge.py 
│├── dag_generate_graph.py 
│├── dag_compute_semantic.py 
│├── dag_aggregate_embeddings.py 
│└── dag_submit_to_pinecone.py 
├── fastapi_app/ 
│├── Dockerfile 
│├── main.py 
│└── requirements.txt 
├── data/ # Folder to store/access shared application data 
├── docker-compose.yml 
├── .env # Environment variables file 
└── README.md # This file

---


## Prerequisites

- **Docker & Docker Compose:** Ensure Docker and Docker Compose are installed on your host.
- **Python 3.9:** For local testing (optional).
- **Environment Variables:** Create a `.env` file in the project root (see below).

---

## Environment Configuration

Create a `.env` file in the project root with at least the following variables (replace placeholder values with your secure keys and credentials):

```dotenv
# Airflow Configuration
AIRFLOW__WEBSERVER__SECRET_KEY=YOUR_SHARED_SECRET_KEY
AIRFLOW__CORE__FERNET_KEY=YOUR_FERNET_KEY_HERE

# Pinecone and OpenAI Configuration
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=your-pinecone-env
PINECONE_INDEX_NAME=graph-embeddings
OPENAI_API_KEY=your-openai-api-key

#Service and Neo4j Configuration
NEO4J_URI=your-key
NEO4J_USER=your-key
NEO4J_PASSWORD=your-key
API_URL=https://api-hackathon-h0fxfrgwh3ekgge7.brazilsouth-01.azurewebsites.net
API_KEY=your-key

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SESSION_TOKEN=
AWS_REGION=
```
## Components Overview
- Airflow:
Orchestrates the multi-step data pipelines.
Access the Airflow UI at http://localhost:8080.

- Kafka:
Acts as the messaging bus between DAGs.
Exposed on ports 9092 (internal) and 29092 (external) with persistent data and debug logging.

- PostgreSQL:
Serves as the metadata database for Airflow.
Accessible on port 5432 with persistent storage.

- Neo4j:
Stores graph data constructed from merged API data.
Accessible via http://localhost:7474 (username: neo4j, password: secret).

- Pinecone:
Stores aggregated vector embeddings along with metadata.

- FastAPI RAG Service:
Provides a /credit_evaluator endpoint that uses an LLM (via OpenAI API) to evaluate creditworthiness based on aggregated embeddings from Pinecone and their context.
Exposed on port 8000.

- The local data folder is mounted inside the container at /app/data.
---
# Steps to Run the Solution

## Build and Run Containers:

Build and start the containers using Docker Compose:

``` bash
docker-compose up --build
This command builds your custom Airflow and FastAPI images, and starts Kafka, PostgreSQL, Neo4j, Airflow webserver & scheduler, and the FastAPI service.
```
### Access Services:

- Airflow UI: http://localhost:8080
Monitor DAG runs and view logs.
- Neo4j Browser: http://localhost:7474
Log in with username neo4j and password secret.
- FastAPI RAG Service: http://localhost:8000
Use the /credit_evaluator endpoint for credit evaluation.
- Kafka: Accessible on ports 9092 and 29092.

### Trigger DAGs and Process Data:

- Airflow DAGs (located in the dags/ folder) are scheduled to run hourly. You can also trigger them manually via the Airflow UI for testing.
The pipeline will fetch and merge API data, generate graphs in Neo4j, compute semantic embeddings, aggregate them, and upsert the results into Pinecone.
Test the RAG Endpoint:

Use cURL, Postman, or your browser to send a POST request:

```bash
curl -X POST http://localhost:8000/credit_evaluator \
-H "Content-Type: application/json" \
-d '{"id": "123"}'
```
### The FastAPI service will:

Retrieve the aggregated embedding and associated metadata for candidate 123 from Pinecone.
Construct a prompt instructing the LLM (via OpenAI API) to evaluate the candidate's creditworthiness.
Return a JSON response with a credit score and explanation.
