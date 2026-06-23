from pydantic import BaseModel
from typing import Optional

class TurmaBase(BaseModel):
    nome: str
    semestre_nivel: Optional[int] = None
    curso_id: Optional[int] = None
    semestre_id: Optional[int] = None

class TurmaCreate(TurmaBase):
    pass

class TurmaResponse(TurmaBase):
    id: int

    class Config:
        from_attributes = True