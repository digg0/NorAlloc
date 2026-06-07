from pydantic import BaseModel
from typing import Optional

class DisciplinaCreate(BaseModel):
    nome: str
    carga_horaria: int
    codigo: Optional[str] = None

class DisciplinaResponse(BaseModel):
    id: int
    nome: str
    carga_horaria: int
    codigo: Optional[str] = None

    class Config:
        from_attributes = True