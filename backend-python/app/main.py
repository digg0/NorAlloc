from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # 1. Adicione esta importação
import os

from app.core.database import Base, engine
from app.api.routers import coordenadores
from app.api.routers import disponibilidade
from app.api.routers import disciplinas 


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NorAlloc - API",
    description="Sistema de Gestão e Alocação de Horários - Módulo Admin",
    version="1.0.0"
)

# 2. Cole este bloco de configuração do CORS aqui
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permite requisições de qualquer frontend
    allow_credentials=True,
    allow_methods=["*"], # Permite POST, GET, PUT, DELETE, etc.
    allow_headers=["*"],
)

app.include_router(coordenadores.router)
app.include_router(disponibilidade.router)
app.include_router(disciplinas.router)

@app.get("/")
def read_root():
    return {"status": "Online", "mensagem": "Backend FastAPI funcionando!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}