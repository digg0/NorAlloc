from datetime import date
from pydantic import BaseModel


class SemestreBase(BaseModel):
    nome: str
    data_inicio: date
    data_fim: date
    status: str


class SemestreCreate(SemestreBase):
    pass


class SemestreUpdate(BaseModel):
    nome: str | None = None
    data_inicio: date | None = None
    data_fim: date | None = None
    status: str | None = None


class SemestreResponse(SemestreBase):
    id: int

    class Config:
        from_attributes = True