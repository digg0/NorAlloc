from pydantic import BaseModel
from typing import Optional

class CursoBase(BaseModel):
    nome: str
    nivel: str


class CursoCreate(CursoBase):
    pass


class CursoUpdate(BaseModel):
    nome: Optional[str] = None
    nivel: Optional[str] = None


class CursoResponse(CursoBase):
    id: int
    ativo: bool

    class Config:
        from_attributes = True
