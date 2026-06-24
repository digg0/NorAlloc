from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional


class CoordenadorBase(BaseModel):
    nome: str = Field(..., min_length=3, max_length=150, description="Nome do coordenador")
    email: EmailStr = Field(..., description="E-mail institucional")
    curso_id: int = Field(..., gt=0, description="ID do curso associado")
    professor_id: Optional[int] = Field(None, gt=0, description="Professor da instituição que também é este coordenador")


class CoordenadorCreate(CoordenadorBase):
    password: str = Field(..., min_length=8, description="Senha forte para acesso")


class CoordenadorUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=3, max_length=150)
    email: Optional[EmailStr] = None
    curso_id: Optional[int] = Field(None, gt=0)
    professor_id: Optional[int] = Field(None, gt=0)
    password: Optional[str] = Field(None, min_length=8)


class CoordenadorResponse(CoordenadorBase):
    id: int
    ativo: bool

    model_config = ConfigDict(from_attributes=True)