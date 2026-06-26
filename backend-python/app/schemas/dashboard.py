from datetime import date
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class ProfessoresResumo(BaseModel):
    total: int
    de: int
    h40: int
    h20: int


class SemestreResumo(BaseModel):
    id: int
    nome: str
    data_inicio: date
    data_fim: date
    status: str

    model_config = ConfigDict(from_attributes=True)


class ResumoGeralResponse(BaseModel):
    """Dados do dashboard de admin/coordenador (contagens gerais)."""
    professores: ProfessoresResumo
    disciplinas: int
    cursos: int
    turmas: int
    coordenadores: int
    ofertas: int
    semestres: List[SemestreResumo]
    semestre_atual: Optional[SemestreResumo] = None


class ResumoProfessorResponse(BaseModel):
    """Dados do dashboard do professor logado."""
    tem_cadastro: bool
    nome: Optional[str] = None
    regime_trabalho: Optional[str] = None
    carga_maxima: Optional[int] = None
    disciplinas_atribuidas: int = 0
    preferencias: int = 0
