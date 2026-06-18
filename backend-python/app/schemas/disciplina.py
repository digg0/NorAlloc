from pydantic import BaseModel

class DisciplinaCreate(BaseModel):
    curso_id: int
    nome: str
    carga_horaria: int

class DisciplinaResponse(BaseModel):
    id: int
    curso_id: int
    nome: str
    carga_horaria: int

    class Config:
        from_attributes = True