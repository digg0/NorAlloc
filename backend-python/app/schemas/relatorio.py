from pydantic import BaseModel
from typing import List, Optional

from app.schemas.alocacao import AlertaResponse


class ResumoRelatorio(BaseModel):
    turmas: int
    disciplinas: int
    professores: int
    carga_total: int


class GradeAula(BaseModel):
    dia: str
    horario: str
    disciplina: str
    professor: str


class TurmaRelatorio(BaseModel):
    nome: str
    grade: List[GradeAula]


class RelatorioResponse(BaseModel):
    curso: str
    semestre: str
    coordenador: Optional[str] = None
    resumo: ResumoRelatorio
    turmas: List[TurmaRelatorio]
    professores_envolvidos: List[str] = []
    disciplinas_ofertadas: List[str] = []
    alertas: List[AlertaResponse] = []
