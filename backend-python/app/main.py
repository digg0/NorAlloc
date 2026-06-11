from fastapi import FastAPI
import os

from app.core.database import Base, engine
from app.api.routers import coordenadores
from app.api.routers import disponibilidade
from app.api.routers import professores
from app.api.routers import preferencias_professor
from app.models import *

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NorAlloc - API",
    description="Sistema de Gestão e Alocação de Horários - Módulo Admin",
    version="1.0.0"
)


app.include_router(coordenadores.router)
app.include_router(disponibilidade.router)
app.include_router(professores.router)
app.include_router(preferencias_professor.router)

@app.get("/")
def read_root():
    return {"status": "Online", "mensagem": "Backend FastAPI funcionando!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}