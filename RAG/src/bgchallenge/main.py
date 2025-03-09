import json
import logging
import os
from http.client import HTTPException
from pathlib import Path
from typing import List

import uvicorn
from openai import OpenAI
from dotenv import load_dotenv
from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse

import PyPDF2
import re

from pinecone.data import index
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from itertools import groupby

from notdiamond import NotDiamond

logger = logging.getLogger(__name__)

load_dotenv()

# Set your OpenAI API key (make sure it's in your environment variables)
api_key = os.getenv("OPENAI_API_KEY", None)
if not api_key:
    raise Exception("OpenAI API key not found. Set the OPENAI_API_KEY environment variable.")

client = OpenAI(api_key=api_key)

# Define the Not Diamond routing client
# client = NotDiamond(api_key=api_key)

app = FastAPI(
    title="Credit Score Evaluator",
    description="Service to answer questions using retrieval-augmented generation (RAG).",
    version="1.0",
)

# --- Data Loading and Indexing ---

# Path to the folder containing the APS data file
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_FOLDER = BASE_DIR / "data"


def extract_text_from_pdf(file_path: str) -> str:
    try:
        with open(file_path, "rb") as f:
            pdf_reader = PyPDF2.PdfReader(f)
            content = ""
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    content += page_text + "\n"
    except FileNotFoundError:
        raise Exception(f"Data file not found at {file_path}. Ensure the file exists in the data directory.")

    return content


def segment_text_into_sections(content: str) -> List[str]:
    sections = []
    # We use a regex pattern to split the document into APS sections.
    header_pattern = r"\n"
    # Use re.split with the capturing group so that the headers are retained in the result.
    splits = re.split(header_pattern, content)
    del splits[0]

    result = [list(group) for k, group in groupby(splits, lambda x: "cedula" in x)]

    # The splits list will alternate between header and body.
    for i in range(0, len(result), 2):
        header = " ".join(result[i]).strip()
        body = "\n".join(result[i + 1]).strip() if i + 1 < len(splits) else ""
        section = header + "\n" + body
        sections.append(section)

    return sections


# --- Data Loading and Indexing ---
def get_sections_of_data(data_folder: str) -> List[str]:
    sections = []
    content = []
    # Iterate over the files in the data folder
    for filename in os.listdir(data_folder):
        if filename.lower().endswith(".pdf"):
            file_path = os.path.join(data_folder, filename)
            content.append(extract_text_from_pdf(file_path))

    # Segment the text content of each PDF into sections
    for pdf_content in content:
        sections.extend(segment_text_into_sections(pdf_content))
    return sections


# Build the index.
def build_index(sections: List[str]):
    """
    Build an index of the sections for efficient retrieval.
    """
    vectorizer = TfidfVectorizer().fit(sections)
    section_embeddings = vectorizer.transform(sections)
    return vectorizer, section_embeddings


# --- Retrieval Function ---
def retrieve_relevant_sections(section_embeddings, vectorizer, question: str, sections: List[str], top_n: int = 3) -> \
        List[str]:
    """
    Retrieve the top_n APS sections most relevant to the given question using cosine similarity.
    """
    # Retrieve the top n relevant sections based on the question.
    question_vec = vectorizer.transform([question])
    similarities = cosine_similarity(question_vec, section_embeddings).flatten()

    # Get indices of the top_n sections (in descending order of similarity).
    top_indices = similarities.argsort()[-top_n:][::-1]
    return [sections[i] for i in top_indices]


# --- LLM Generation ---

def generate_answer(question: str, context: str) -> str:
    """
    Call OpenAI's ChatCompletion API to generate an answer using only the provided context.
    """
    # Construct a prompt for the LLM. The prompt instructs the LLM to evaluate creditworthiness.
    prompt = (
        f"You are an expert credit evaluator. Using the following candidate data:\n\n"
        f"Context: {context}\n\n"
        "Evaluate the candidate's creditworthiness, considering all relationships and data points. "
        "Provide a detailed explanation and assign a credit score between 1 and 100 (where 100 is excellent credit). "
        "Return your response as a JSON object with keys 'score' and 'explanation'."
    )

    messages = [
        {
            "role": "system",
            "content": "You are a helpful assistant that answers questions based solely on the provided context. "
                       "Do not include any information that is not present in the context."
        },
        {
            "role": "user",
            "content": prompt
        }
    ]

    # # The best LLM is determined by Not Diamond based on the messages and specified models
    # result, session_id, provider = client.chat.completions.create(
    #     messages=messages,
    #     model=['openai/gpt-3.5-turbo', 'anthropic/claude-3-5-sonnet-20240620']
    # )
    #
    # print("ND session ID: ", session_id)  # A unique ID of Not Diamond's recommendation
    # print("LLM called: ", provider.model)  # The LLM routed to
    # print("LLM output: ", result.content)  # The LLM response

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=150,
            temperature=0.7,
        )
        answer = response.choices[0].message.content.strip()
    except Exception as e:
        answer = f"Error generating answer: {e}"
    return answer


def run_inference(question: str, data_folder: str = DATA_FOLDER) -> str:
    sections = get_sections_of_data(data_folder)
    if not sections:
        raise Exception("No APS sections were found in the data folder.")
    vectorizer, embeddings = build_index(sections)

    # Retrieve the most relevant sections based on the question.
    relevant_sections = retrieve_relevant_sections(embeddings, vectorizer, question, sections)
    context = "\n\n".join(relevant_sections)

    # Generate the answer using the retrieved context.
    answer = generate_answer(question, context)
    return answer


# --- API Endpoints ---

@app.get("/ask", summary="Ask a question about a patient's health.")
def ask_question(question: str = Query(..., title="Question to ask")):
    """
    API endpoint that accepts a high-level question as a query parameter, retrieves the most relevant APS sections
    from the document, and returns an answer generated using the retrieved context.
    """
    answer = run_inference(question)

    return JSONResponse(content={"answer": answer})


# Define the request model for credit evaluation
class CreditEvaluatorRequest(BaseModel):
    id: str

@app.post("/credit_evaluator")
def credit_evaluator(request: CreditEvaluatorRequest):
    # Fetch the aggregated embedding and metadata from Pinecone using the provided ID
    fetch_response = index.fetch(ids=[request.id])
    if request.id not in fetch_response["vectors"]:
        raise HTTPException(status_code=404, detail="ID not found in Pinecone index.")

    vector_data = fetch_response["vectors"][request.id]
    metadata = vector_data.get("metadata", {})

    # Extract context from metadata (e.g., the original merged API data)
    context = metadata.get("api_data", "No additional context provided.")

    # Construct a prompt for the LLM. The prompt instructs the LLM to evaluate creditworthiness.
    prompt = (
        f"You are an expert credit evaluator. Using the following candidate data:\n\n"
        f"Candidate ID: {request.id}\n"
        f"Context: {context}\n\n"
        "Evaluate the candidate's creditworthiness, considering all relationships and data points. "
        "Provide a detailed explanation and assign a credit score between 1 and 100 (where 100 is excellent credit). "
        "Return your response as a JSON object with keys 'score' and 'explanation'."
    )

    try:
        # Call OpenAI ChatCompletion API using a Chat model (adjust model as needed)
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert credit evaluator."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
        )
        result_text = response["choices"][0]["message"]["content"]

        # Try parsing the result as JSON
        try:
            result_json = json.loads(result_text)
            return result_json
        except Exception:
            # If parsing fails, return the text response
            return {"result": result_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def root():
    return {"message": "FastAPI RAG Credit Evaluator Service is running."}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8081)
