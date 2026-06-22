from pydantic import BaseModel, Field, ConfigDict
from typing import Optional


class OfertaDisciplinaBase(BaseModel):
    turma_id: int = Field(..., gt=0, description="ID da turma que recebe a aula")
    disciplina_id: int = Field(..., gt=0, description="ID da disciplina ofertada")
    professor_id: Optional[int] = Field(
        None, gt=0, description="ID do professor responsável (opcional na criação)"
    )
    carga_horaria: int = Field(
        ..., gt=0, description="Carga horária da oferta no semestre"
    )


class OfertaDisciplinaCreate(OfertaDisciplinaBase):
    """Corpo do POST /api/ofertas — a instância da aula (turma + disciplina)."""


class OfertaDisciplinaUpdate(BaseModel):
    turma_id: Optional[int] = Field(None, gt=0)
    disciplina_id: Optional[int] = Field(None, gt=0)
    professor_id: Optional[int] = Field(None, gt=0)
    carga_horaria: Optional[int] = Field(None, gt=0)


class OfertaDisciplinaResponse(OfertaDisciplinaBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
