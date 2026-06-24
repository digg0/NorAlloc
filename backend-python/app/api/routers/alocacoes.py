from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.alocacao import Alocacao
from app.models.horario import Horario
from app.models.oferta_disciplina import OfertaDisciplina
from app.models.turma import Turma
from app.schemas.alocacao import (
    AlertaResponse,
    AlocacaoCreate,
    AlocacaoResponse,
    AlocacaoUpdate,
    GerarGradeResponse,
    MoverAlocacaoRequest,
)
from app.services import solver_service, validacao_service

router = APIRouter(prefix="/alocacoes", tags=["Alocações"])


def _query_base(db: Session):
    return db.query(Alocacao).options(
        joinedload(Alocacao.oferta), joinedload(Alocacao.horario)
    )


def _buscar_ou_404(alocacao_id: int, db: Session) -> Alocacao:
    alocacao = _query_base(db).filter(Alocacao.id == alocacao_id).first()
    if not alocacao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alocação não encontrada.")
    return alocacao


# ==========================
# CRUD
# ==========================

@router.post("/", response_model=AlocacaoResponse, status_code=status.HTTP_201_CREATED)
def criar_alocacao(dados: AlocacaoCreate, db: Session = Depends(get_db)):
    if not db.query(OfertaDisciplina).filter(OfertaDisciplina.id == dados.oferta_id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Oferta não encontrada.")
    if not db.query(Horario).filter(Horario.id == dados.horario_id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Horário não encontrado.")

    nova = Alocacao(oferta_id=dados.oferta_id, horario_id=dados.horario_id)
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return _buscar_ou_404(nova.id, db)


@router.get("/", response_model=List[AlocacaoResponse])
def listar_alocacoes(db: Session = Depends(get_db)):
    return _query_base(db).order_by(Alocacao.id).all()


@router.get("/{alocacao_id}", response_model=AlocacaoResponse)
def buscar_alocacao(alocacao_id: int, db: Session = Depends(get_db)):
    return _buscar_ou_404(alocacao_id, db)


@router.put("/{alocacao_id}", response_model=AlocacaoResponse)
def atualizar_alocacao(alocacao_id: int, dados: AlocacaoUpdate, db: Session = Depends(get_db)):
    alocacao = _buscar_ou_404(alocacao_id, db)
    if not db.query(Horario).filter(Horario.id == dados.horario_id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Horário não encontrado.")
    alocacao.horario_id = dados.horario_id
    db.commit()
    return _buscar_ou_404(alocacao_id, db)


@router.delete("/{alocacao_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_alocacao(alocacao_id: int, db: Session = Depends(get_db)):
    alocacao = _buscar_ou_404(alocacao_id, db)
    db.delete(alocacao)
    db.commit()
    return None


# ==========================
# SOLVER
# ==========================

@router.post("/gerar-grade", response_model=GerarGradeResponse)
def gerar_grade(semestre_id: int, db: Session = Depends(get_db)):
    """Executa o solver Z3 e persiste a grade gerada para o semestre."""
    return solver_service.gerar_grade(semestre_id, db)


# ==========================
# EDIÇÃO MANUAL
# ==========================

@router.patch("/{alocacao_id}/mover", response_model=AlocacaoResponse)
def mover_alocacao(alocacao_id: int, dados: MoverAlocacaoRequest, db: Session = Depends(get_db)):
    """Move uma aula já alocada para outro horário (ajuste manual do coordenador)."""
    alocacao = _buscar_ou_404(alocacao_id, db)
    if not db.query(Horario).filter(Horario.id == dados.novo_horario_id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Horário não encontrado.")
    alocacao.horario_id = dados.novo_horario_id
    db.commit()
    return _buscar_ou_404(alocacao_id, db)


# ==========================
# CONSULTAS
# ==========================

@router.get("/turma/{turma_id}", response_model=List[AlocacaoResponse])
def grade_por_turma(turma_id: int, db: Session = Depends(get_db)):
    return (
        _query_base(db)
        .join(OfertaDisciplina, Alocacao.oferta_id == OfertaDisciplina.id)
        .filter(OfertaDisciplina.turma_id == turma_id)
        .all()
    )


@router.get("/professor/{professor_id}", response_model=List[AlocacaoResponse])
def grade_por_professor(professor_id: int, db: Session = Depends(get_db)):
    return (
        _query_base(db)
        .join(OfertaDisciplina, Alocacao.oferta_id == OfertaDisciplina.id)
        .filter(OfertaDisciplina.professor_id == professor_id)
        .all()
    )


@router.get("/semestre/{semestre_id}", response_model=List[AlocacaoResponse])
def grade_por_semestre(semestre_id: int, db: Session = Depends(get_db)):
    return (
        _query_base(db)
        .join(OfertaDisciplina, Alocacao.oferta_id == OfertaDisciplina.id)
        .join(Turma, OfertaDisciplina.turma_id == Turma.id)
        .filter(Turma.semestre_id == semestre_id)
        .all()
    )


@router.get("/validar/{semestre_id}", response_model=List[AlertaResponse])
def validar_semestre(semestre_id: int, db: Session = Depends(get_db)):
    """Calcula dinamicamente os alertas da grade do semestre (sem tabela própria)."""
    return validacao_service.validar_semestre(semestre_id, db)
