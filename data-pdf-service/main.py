import os
import requests
from fpdf import FPDF
from fastapi import FastAPI, Response, HTTPException
from dotenv import load_dotenv
from typing import Dict, List

app = FastAPI()
load_dotenv()

API_URL = os.getenv("API_URL")
API_KEY = os.getenv("API_KEY")

ENDPOINTS = {
    "persona": f"{API_URL}/Hackathon/persona",
    "auto": f"{API_URL}/Hackathon/auto",
    "establecimiento": f"{API_URL}/Hackathon/establecimiento",
    "salario": f"{API_URL}/Hackathon/salario",
    "scoreburo": f"{API_URL}/Hackathon/scoreburo",
    "supercia": f"{API_URL}/Hackathon/supercia",
}

def get_data(endpoint: str, params: Dict = None):
    headers = {"accept": "*/*", "HCK-API-Key": API_KEY}
    response = requests.get(ENDPOINTS[endpoint], headers=headers, params=params)
    
    if response.status_code == 200:
        return response.json() or []
    raise HTTPException(status_code=500, detail=f"Error al obtener datos de {endpoint}")

def get_all_cedulas() -> List[str]:
    personas = get_data("persona", {"pageNumber": 1, "pageSize": 1000})
    return [p["cedula"] for p in personas] if personas else []

def generate_pdf(title: str, data: List[Dict], fields: List[str]) -> str:
    if not data:
        raise HTTPException(status_code=404, detail="No se encontraron datos")

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=5)
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, title, ln=True, align="C")

    for item in data:
        for field in fields:
            pdf.multi_cell(0, 7, f"{field.capitalize()}: {item.get(field, 'N/A')}")
        pdf.ln(5)

    filename = f"{title.replace(' ', '_')}.pdf"
    pdf.output(filename)
    return filename

@app.get("/generate-pdf/{category}")
def generate_category_pdf(category: str):
    field_map = {
        "persona": ["cedula", "nombres", "apellidos", "ciudadania", "fechaNacimiento", 
                    "estadoCivil", "profesion", "nivelEstudios", "esCliente", "tipoPersona"],
        "auto": ["cedula", "marca", "modelo", "clase", "fabricacion", "precioVenta"],
        "establecimiento": ["cedula", "estadoContribuyente", "tipoContribuyente", "numeroEstablecimientos",
                            "provincia", "ciudad", "actividadEconomica"],
        "salario": ["cedula", "rucEmpresa", "nombreEmpresa", "valorSalario", "sector"],
        "scoreburo": ["cedula", "maximoCupoTC", "marcaTarjeta", "cupoCreditos"],
        "supercia": ["cedula", "tamanoEmpresa", "ventas", "impuestoRenta"],
    }

    if category not in field_map:
        raise HTTPException(status_code=400, detail="Categoría no válida")

    data = get_data(category, {"pageNumber": 1, "pageSize": 1000})
    pdf_file = generate_pdf(f"Datos de {category.capitalize()}", data, field_map[category])

    return Response(content=open(pdf_file, 'rb').read(), media_type="application/pdf")

@app.get("/generate-all-pdfs")
def generate_all_pdfs():
    cedulas = get_all_cedulas()
    pdf_files = []

    for cedula in cedulas:
        data = {key: get_data(key, {"cedula": cedula}) for key in ENDPOINTS}
        pdf_file = generate_pdf(f"Datos de {cedula}", data["persona"], ["cedula", "nombres", "apellidos"])
        pdf_files.append(pdf_file)

    return {"pdf_files": pdf_files}
