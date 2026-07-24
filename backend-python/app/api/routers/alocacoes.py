from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import obter_curso_id_coordenador, obter_usuario_atual
from app.models.alocacao import Alocacao
from app.models.horario import Horario
from app.models.oferta_disciplina import OfertaDisciplina
from app.models.turma import Turma
from app.models.usuario import Usuario
from app.schemas.alocacao import (
    AlertaResponse,
    AlocacaoCreate,
    AlocacaoResponse,
    AlocacaoUpdate,
    AplicarPropostaRequest,
    GerarGradeResponse,
    MoverAlocacaoRequest,
    PropostaItemResponse,
)
from app.services import solver_service, validacao_service

router = APIRouter(prefix="/alocacoes", tags=["Alocações"])


def _query_base(db: Session, curso_id: Optional[int] = None):
    """Query base de Alocacao, sempre com OfertaDisciplina/Turma já joinados
    (para permitir filtrar por turma_id/professor_id/semestre_id/curso_id sem
    produzir produto cartesiano) e com oferta/horario pré-carregados."""
    query = (
        db.query(Alocacao)
        .join(OfertaDisciplina, Alocacao.oferta_id == OfertaDisciplina.id)
        .join(Turma, OfertaDisciplina.turma_id == Turma.id)
        .options(joinedload(Alocacao.oferta), joinedload(Alocacao.horario))
    )
    if curso_id is not None:
        query = query.filter(Turma.curso_id == curso_id)
    return query


def _buscar_ou_404(alocacao_id: int, db: Session, curso_id: Optional[int] = None) -> Alocacao:
    alocacao = _query_base(db, curso_id).filter(Alocacao.id == alocacao_id).first()
    if not alocacao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alocação não encontrada.")
    return alocacao


def _validar_turma_do_coordenador(db: Session, turma_id: int, curso_id_coordenador: Optional[int]):
    if curso_id_coordenador is None:
        return
    turma = db.query(Turma).filter(Turma.id == turma_id).first()
    if not turma or turma.curso_id != curso_id_coordenador:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta turma não pertence ao seu curso.",
        )


# ==========================
# SOLVER  (antes de /{alocacao_id} para evitar 405 por match de path)
# ==========================

@router.post("/gerar-grade-propostas", response_model=List[List[PropostaItemResponse]])
def gerar_grade_propostas(
    semestre_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    """Gera 3 propostas de grade distintas sem persistir, usando Z3 com enumeração de
    soluções. Cada proposta bloqueia as atribuições da anterior para forçar uma
    distribuição diferente; se o Z3 não encontrar soluções suficientes, completa
    com greedy randomizado. O coordenador escolhe uma proposta via /aplicar-proposta."""
    curso_id_coordenador = obter_curso_id_coordenador(usuario, db)
    try:
        return solver_service.gerar_grade_propostas(semestre_id, db, curso_id=curso_id_coordenador)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/aplicar-proposta", response_model=GerarGradeResponse)
def aplicar_proposta(
    semestre_id: int,
    body: AplicarPropostaRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    """Limpa a grade do semestre e aplica a proposta enviada no corpo."""
    curso_id_coordenador = obter_curso_id_coordenador(usuario, db)
    pares = [(item.oferta_id, item.horario_id) for item in body.items]
    return solver_service.aplicar_proposta(semestre_id, pares, db, curso_id=curso_id_coordenador)


@router.post("/gerar-grade", response_model=GerarGradeResponse)
def gerar_grade(
    semestre_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    """Executa o solver Z3 e persiste a grade gerada para o semestre."""
    curso_id_coordenador = obter_curso_id_coordenador(usuario, db)
    return solver_service.gerar_grade(semestre_id, db, curso_id=curso_id_coordenador)


# ==========================
# CRUD
# ==========================

@router.post("/", response_model=AlocacaoResponse, status_code=status.HTTP_201_CREATED)
def criar_alocacao(
    dados: AlocacaoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    oferta = db.query(OfertaDisciplina).filter(OfertaDisciplina.id == dados.oferta_id).first()
    if not oferta:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Oferta não encontrada.")
    if not db.query(Horario).filter(Horario.id == dados.horario_id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Horário não encontrado.")

    curso_id_coordenador = obter_curso_id_coordenador(usuario, db)
    _validar_turma_do_coordenador(db, oferta.turma_id, curso_id_coordenador)

    nova = Alocacao(oferta_id=dados.oferta_id, horario_id=dados.horario_id)
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return _buscar_ou_404(nova.id, db)


@router.get("/", response_model=List[AlocacaoResponse])
def listar_alocacoes(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    curso_id_coordenador = obter_curso_id_coordenador(usuario, db)
    return _query_base(db, curso_id_coordenador).order_by(Alocacao.id).all()


@router.get("/{alocacao_id}", response_model=AlocacaoResponse)
def buscar_alocacao(
    alocacao_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    curso_id_coordenador = obter_curso_id_coordenador(usuario, db)
    return _buscar_ou_404(alocacao_id, db, curso_id_coordenador)


@router.put("/{alocacao_id}", response_model=AlocacaoResponse)
def atualizar_alocacao(
    alocacao_id: int,
    dados: AlocacaoUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    curso_id_coordenador = obter_curso_id_coordenador(usuario, db)
    alocacao = _buscar_ou_404(alocacao_id, db, curso_id_coordenador)
    if not db.query(Horario).filter(Horario.id == dados.horario_id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Horário não encontrado.")
    alocacao.horario_id = dados.horario_id
    db.commit()
    return _buscar_ou_404(alocacao_id, db)


@router.delete("/{alocacao_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_alocacao(
    alocacao_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    curso_id_coordenador = obter_curso_id_coordenador(usuario, db)
    alocacao = _buscar_ou_404(alocacao_id, db, curso_id_coordenador)
    db.delete(alocacao)
    db.commit()
    return None


@router.delete("/semestre/{semestre_id}")
def limpar_grade(
    semestre_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    """Remove todas as alocações do semestre (coordenador: só do próprio
    curso), sem apagar ofertas/turmas/disciplinas — útil para gerar a grade
    de novo do zero."""
    curso_id_coordenador = obter_curso_id_coordenador(usuario, db)
    removidas = solver_service.limpar_grade(semestre_id, db, curso_id=curso_id_coordenador)
    return {"removidas": removidas}


# ==========================
# EDIÇÃO MANUAL
# ==========================

@router.patch("/{alocacao_id}/mover", response_model=AlocacaoResponse)
def mover_alocacao(
    alocacao_id: int,
    dados: MoverAlocacaoRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    """Move uma aula já alocada para outro horário (ajuste manual do coordenador)."""
    curso_id_coordenador = obter_curso_id_coordenador(usuario, db)
    alocacao = _buscar_ou_404(alocacao_id, db, curso_id_coordenador)
    if not db.query(Horario).filter(Horario.id == dados.novo_horario_id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Horário não encontrado.")
    alocacao.horario_id = dados.novo_horario_id
    db.commit()
    return _buscar_ou_404(alocacao_id, db)


# ==========================
# CONSULTAS
# ==========================

@router.get("/turma/{turma_id}", response_model=List[AlocacaoResponse])
def grade_por_turma(
    turma_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    curso_id_coordenador = obter_curso_id_coordenador(usuario, db)
    _validar_turma_do_coordenador(db, turma_id, curso_id_coordenador)
    return (
        _query_base(db)
        .filter(OfertaDisciplina.turma_id == turma_id)
        .all()
    )


@router.get("/professor/{professor_id}", response_model=List[AlocacaoResponse])
def grade_por_professor(
    professor_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    curso_id_coordenador = obter_curso_id_coordenador(usuario, db)
    return (
        _query_base(db, curso_id_coordenador)
        .filter(OfertaDisciplina.professor_id == professor_id)
        .all()
    )


@router.get("/semestre/{semestre_id}", response_model=List[AlocacaoResponse])
def grade_por_semestre(
    semestre_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    curso_id_coordenador = obter_curso_id_coordenador(usuario, db)
    return (
        _query_base(db, curso_id_coordenador)
        .filter(Turma.semestre_id == semestre_id)
        .all()
    )


@router.get("/validar/{semestre_id}", response_model=List[AlertaResponse])
def validar_semestre(
    semestre_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    """Calcula dinamicamente os alertas da grade do semestre (sem tabela própria)."""
    curso_id_coordenador = obter_curso_id_coordenador(usuario, db)
    return validacao_service.validar_semestre(semestre_id, db, curso_id=curso_id_coordenador)
