from typing import Optional
from pydantic import BaseModel

class DisciplinaCreate(BaseModel):
    curso_id: int
    nome: str
    carga_horaria: Optional[int] = None
    codigo: Optional[str] = None
    ano_semestre: Optional[int] = None

class DisciplinaResponse(BaseModel):
    id: int
    curso_id: int
    nome: str
    carga_horaria: Optional[int] = None
    codigo: Optional[str] = None
    ano_semestre: Optional[int] = None

    class Config:
        from_attributes = True