from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional


class CoordenadorCreate(BaseModel):
    professor_id: int = Field(..., gt=0, description="Professor da instituição que vai coordenar o curso")
    curso_id: int = Field(..., gt=0, description="ID do curso associado")
    password: Optional[str] = Field(None, min_length=8, description="Senha de acesso (opcional se o professor já tiver login)")


class CoordenadorUpdate(BaseModel):
    professor_id: Optional[int] = Field(None, gt=0, description="Troca o docente que coordena o curso")
    curso_id: Optional[int] = Field(None, gt=0)
    password: Optional[str] = Field(None, min_length=8)


class CoordenadorResponse(BaseModel):
    id: int
    nome: str
    email: EmailStr
    curso_id: int
    professor_id: Optional[int] = None
    ativo: bool

    model_config = ConfigDict(from_attributes=True)
