from fastapi import FastAPI
import os

app = FastAPI(title="Gestão de Horários - API")

@app.get("/")
def read_root():
    return {
        "status": "Online",
        "mensagem": "Backend Python (FastAPI) rodando com sucesso!",
        "database_url": os.getenv("DATABASE_URL")
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
