from fastapi import FastAPI
import os

from app.core.database import Base, engine
from app.api.routers import coordenadores
from app.api.routers import disponibilidade
from app.models.usuario import Usuario
from app.models.professor import Professor
from app.models.curso import Curso
from app.models.disciplina import Disciplina
from app.models.horario import Horario
from app.models.semestre import Semestre

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NorAlloc - API",
    description="Sistema de Gestão e Alocação de Horários - Módulo Admin",
    version="1.0.0"
)


app.include_router(coordenadores.router)
app.include_router(disponibilidade.router)

@app.get("/")
def read_root():
    return {"status": "Online", "mensagem": "Backend FastAPI funcionando!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}