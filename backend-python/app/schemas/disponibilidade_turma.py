from pydantic import BaseModel
from typing import Optional

class DisponibilidadeTurmaBase(BaseModel):
    turma_id: int
    horario_id: int
    disponivel: Optional[bool] = True

class DisponibilidadeTurmaCreate(DisponibilidadeTurmaBase):
    pass

class DisponibilidadeTurmaResponse(DisponibilidadeTurmaBase):
    id: int

    class Config:
        from_attributes = True # Permite que o Pydantic leia direto do SQLAlchemy