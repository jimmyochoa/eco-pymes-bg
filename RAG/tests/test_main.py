import os
import tempfile

import pytest
from fastapi.testclient import TestClient

from aichallenge.main import app, build_index, retrieve_relevant_sections, run_inference


def test_retrieve_relevant_sections():
    # Setup dummy APS sections.
    dummy_sections = [
        "Patient reports cough and fever. Diagnosis: acute viral infection.",
        "Patient presents with headache and nausea.",
        "Patient is healthy and shows no symptoms."
    ]
    # Build the index from the dummy data.
    vectorizer, embeddings = build_index(dummy_sections)

    # Define a question that should match the first section.
    question = "What symptoms indicate an acute viral infection?"
    relevant = retrieve_relevant_sections(embeddings, vectorizer, question=question, sections=dummy_sections, top_n=1)

    # Check that the retrieved section mentions 'acute viral infection'.
    assert "acute viral infection" in relevant[0].lower()


# Dummy response class for monkeypatching OpenAI's API.
class DummyResponse:
    class Choice:
        def __init__(self, message):
            self.message = message

    def __init__(self, text):
        self.choices = [self.Choice({"content": text})]


def dummy_chat_completion_create(**kwargs):
    return DummyResponse("Dummy answer from integration test.")


def test_run_rag_integration(monkeypatch):
    # Create a temporary directory to serve as the data folder.
    with tempfile.TemporaryDirectory() as temp_data_dir:
        # Create a dummy PDF file in the temporary directory.
        dummy_pdf_path = os.path.join(temp_data_dir, "dummy.pdf")
        try:
            from fpdf import FPDF
            from openai import OpenAI
        except ImportError:
            pytest.skip("fpdf module not installed, skipping integration test.")

        pdf = FPDF()
        pdf.add_page()
        # Write dummy APS content that includes the header pattern.
        dummy_text = (
            "01/05/2024, 11:37 AM Summary View for Test User | Account Number:1234567890\n"
            "Patient reports cough and fever.\n"
            "Diagnosis: Acute viral infection.\n"
        )
        pdf.set_font("Arial", size=12)
        pdf.multi_cell(0, 10, dummy_text)
        pdf.output(dummy_pdf_path)

        # Monkey-patch openai.chat.completion.create to return a dummy response.
        monkeypatch.setattr(OpenAI(api_key="").chat.completions, "create", dummy_chat_completion_create)

        # Run the pipeline using the temporary directory as the data folder.
        question = "What is the diagnosis?"
        answer = run_inference(question, data_folder=temp_data_dir)
        assert "The diagnosis is acute viral infection." in answer


def test_ask():
    # Test the /ask endpoint with a known question.
    with TestClient(app) as client:
        # Ask what are the known allergies?
        response = client.get("/ask?question=what%20are%20the%20known%20allergies%3F")
        # Check that the response is successful and contains the expected answer.
        assert response.status_code == 200
        answer = response.json()["answer"]
        # Check that the answer mentions 'no known drug allergies'.
        assert "no known drug allergies" in answer.lower()
