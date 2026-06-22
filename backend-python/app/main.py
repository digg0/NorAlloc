from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware 
import os

from app.core.database import Base, engine

# 1. IMPORTA OS MODELOS PRIMEIRO (Evita conflitos de nomes)
from app.models import *

# 2. IMPORTA OS ROUTERS DEPOIS
from app.api.routers import coordenadores
from app.api.routers import disponibilidade
from app.api.routers import disciplinas 
from app.api.routers import horarios
from app.api.routers import ofertas
from app.api.routers import disponibilidade_turma
from app.api.routers import cursos
from app.api.routers import semestre

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NorAlloc - API",
    description="Sistema de Gestão e Alocação de Horários - Módulo Admin",
    version="1.0.0"
)

# Configuração do CORS
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
app.include_router(horarios.router)
app.include_router(ofertas.router)
app.include_router(disponibilidade_turma.router)
app.include_router(cursos.router)
app.include_router(semestre.router)

@app.get("/")
def read_root():
    return {"status": "Online", "mensagem": "Backend FastAPI funcionando!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}