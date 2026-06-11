from pydantic import BaseModel, Field, ConfigDict
from typing import Optional


class ProfessorBase(BaseModel):
    nome: str = Field(..., min_length=3, max_length=150, description="Nome do professor")
    usuario_id: int = Field(..., gt=0, description="ID do usuário associado")
    regime_trabalho: str = Field(..., description="Regime de trabalho (ex: Integral, Parcial, Horista)")
    carga_maxima: int = Field(..., gt=0, description="Carga horária máxima semanal")


class ProfessorCreate(ProfessorBase):
    pass


class ProfessorUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=3, max_length=150)
    regime_trabalho: Optional[str] = None
    carga_maxima: Optional[int] = Field(None, gt=0)


class ProfessorResponse(ProfessorBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
