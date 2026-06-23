from pydantic import BaseModel


class AlocacaoBase(BaseModel):
    oferta_id: int
    horario_id: int


class AlocacaoCreate(AlocacaoBase):
    pass


class AlocacaoUpdate(BaseModel):
    horario_id: int


class AlocacaoResponse(AlocacaoBase):
    id: int

    class Config:
        from_attributes = True


class GerarGradeResponse(BaseModel):
    sucesso: bool
    mensagem: str
    total_alocacoes: int