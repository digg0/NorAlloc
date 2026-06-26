from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.horario import HorarioResponse
from app.schemas.oferta_disciplina import OfertaDisciplinaResponse


class AlocacaoBase(BaseModel):
    oferta_id: int
    horario_id: int


class AlocacaoCreate(AlocacaoBase):
    pass


class AlocacaoUpdate(BaseModel):
    horario_id: int


class AlocacaoResponse(AlocacaoBase):
    id: int
    oferta: Optional[OfertaDisciplinaResponse] = None
    horario: Optional[HorarioResponse] = None

    model_config = ConfigDict(from_attributes=True)


class MoverAlocacaoRequest(BaseModel):
    novo_horario_id: int = Field(..., gt=0, description="ID do novo horário para a aula")


class GerarGradeResponse(BaseModel):
    sucesso: bool
    mensagem: str
    total_alocacoes: int


class AlertaResponse(BaseModel):
    tipo: str
    descricao: str
    entidade_tipo: str
    entidade_id: int
