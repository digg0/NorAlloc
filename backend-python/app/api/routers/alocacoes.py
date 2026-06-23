from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db

from app.schemas.alocacao import (
    AlocacaoCreate,
    AlocacaoUpdate,
    AlocacaoResponse,
    GerarGradeResponse
)

router = APIRouter(
    prefix="/alocacoes",
    tags=["Alocações"]
)


# ==========================
# CRUD
# ==========================

@router.post(
    "/",
    response_model=AlocacaoResponse
)
def criar_alocacao(
    dados: AlocacaoCreate,
    db: Session = Depends(get_db)
):
    pass


@router.get("/")
def listar_alocacoes(
    db: Session = Depends(get_db)
):
    pass


@router.get("/{alocacao_id}")
def buscar_alocacao(
    alocacao_id: int,
    db: Session = Depends(get_db)
):
    pass


@router.put("/{alocacao_id}")
def atualizar_alocacao(
    alocacao_id: int,
    dados: AlocacaoUpdate,
    db: Session = Depends(get_db)
):
    pass


@router.delete("/{alocacao_id}")
def remover_alocacao(
    alocacao_id: int,
    db: Session = Depends(get_db)
):
    pass


# ==========================
# SOLVER
# ==========================

@router.post(
    "/gerar-grade",
    response_model=GerarGradeResponse
)
def gerar_grade(
    semestre_id: int,
    db: Session = Depends(get_db)
):
    """
    1. Busca ofertas do semestre

    2. Busca:
        professores
        disponibilidades
        preferencias
        horarios

    3. Executa solver Z3

    4. Salva resultado em alocacoes

    5. Retorna quantidade gerada
    """

    pass


# ==========================
# CONSULTAS
# ==========================

@router.get("/turma/{turma_id}")
def grade_por_turma(
    turma_id: int,
    db: Session = Depends(get_db)
):
    pass


@router.get("/professor/{professor_id}")
def grade_por_professor(
    professor_id: int,
    db: Session = Depends(get_db)
):
    pass


@router.get("/semestre/{semestre_id}")
def grade_por_semestre(
    semestre_id: int,
    db: Session = Depends(get_db)
):
    pass