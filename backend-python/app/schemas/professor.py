from datetime import date
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Literal, Optional


class PreferenciaProfessorBase(BaseModel):
    prefere_aula_dupla: Optional[bool] = Field(None, description="Se prefere aulas duplas/geminadas")
    evitar_janelas: Optional[bool] = Field(None, description="Se prefere evitar janelas entre aulas")
    evitar_sexta: Optional[bool] = Field(None, description="Se prefere evitar aulas na sexta-feira")
    prefere_manha: Optional[bool] = Field(None, description="Se prefere aulas pela manhã")
    max_aulas_dia: Optional[int] = Field(None, ge=1, le=8, description="Máximo de aulas por dia")
    min_aulas_dia: Optional[int] = Field(None, ge=1, le=6, description="Mínimo de aulas por dia")


class PreferenciaProfessorCreate(PreferenciaProfessorBase):
    """Schema para criar uma nova preferência de professor."""
    pass


class PreferenciaProfessorUpdate(BaseModel):
    """Schema para atualizar uma preferência existente."""
    prefere_aula_dupla: Optional[bool] = None
    evitar_janelas: Optional[bool] = None
    evitar_sexta: Optional[bool] = None
    prefere_manha: Optional[bool] = None
    max_aulas_dia: Optional[int] = Field(None, ge=1, le=8)
    min_aulas_dia: Optional[int] = Field(None, ge=1, le=6)


class PreferenciaProfessorResponse(PreferenciaProfessorBase):
    """Schema para retornar uma preferência de professor."""
    id: int
    professor_id: int

    model_config = ConfigDict(from_attributes=True)


class ProfessorBase(BaseModel):
    nome: str = Field(..., min_length=3, max_length=150, description="Nome do professor")
    email: EmailStr = Field(..., description="E-mail institucional do professor")
    regime_trabalho: str = Field(..., description="Regime de trabalho (DE, 40H, 20H)")
    area: Optional[str] = Field(None, description="Área de atuação")
    carga_maxima: Optional[int] = Field(None, gt=0, description="Carga horária máxima semanal")


class ProfessorCreate(ProfessorBase):
    """Schema para criar um novo professor.

    Quando `password` é informado, também é criada uma conta de login
    (usuarios, tipo PROFESSOR) para o docente — igual ao fluxo de coordenador.
    """
    password: Optional[str] = Field(None, min_length=8, description="Senha de acesso (opcional)")


class ProfessorUpdate(BaseModel):
    """Schema para atualizar um professor (parcial)."""
    nome: Optional[str] = Field(None, min_length=3, max_length=150)
    email: Optional[EmailStr] = None
    regime_trabalho: Optional[str] = None
    area: Optional[str] = None
    carga_maxima: Optional[int] = Field(None, gt=0)
    password: Optional[str] = Field(None, min_length=8, description="Nova senha de acesso (opcional)")


class ProfessorResponse(ProfessorBase):
    """Schema para retornar um professor."""
    id: int

    model_config = ConfigDict(from_attributes=True)


class SituacaoProfessorResponse(BaseModel):
    situacao: str
    carga_disponivel: int
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None
    observacao: Optional[str] = None


class SituacaoProfessorUpdate(BaseModel):
    situacao: Literal["ativo", "afastado", "carga_reduzida"]
    carga_disponivel: int = Field(..., ge=0)
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None
    observacao: Optional[str] = None
