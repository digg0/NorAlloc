from pydantic import BaseModel
from typing import List, Optional

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
    resumo: ResumoRelatorio
    turmas: List[TurmaRelatorio]
    alertas: List[str] = []