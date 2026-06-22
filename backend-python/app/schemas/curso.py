from pydantic import BaseModel

class CursoBase(BaseModel):
    nome: str
    nivel: str


class CursoCreate(CursoBase):
    pass


class CursoResponse(CursoBase):
    id: int

    class Config:
        from_attributes = True