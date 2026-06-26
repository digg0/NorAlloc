from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.deps import obter_curso_id_coordenador, obter_usuario_atual
from app.models.oferta_disciplina import OfertaDisciplina
from app.models.turma import Turma
from app.models.disciplina import Disciplina
from app.models.professor import Professor
from app.models.usuario import Usuario
from app.schemas.oferta_disciplina import (
    OfertaDisciplinaCreate,
    OfertaDisciplinaUpdate,
    OfertaDisciplinaResponse,
)
from app.api.routers.auth import verificar_admin_ou_coordenador

router = APIRouter(
    prefix="/api/ofertas", tags=["Módulo de Cadastros Base - Ofertas de Disciplina"]
)


def _validar_turma_do_coordenador(db: Session, turma_id: int, curso_id_coordenador: Optional[int]):
    if curso_id_coordenador is None:
        return
    turma = db.query(Turma).filter(Turma.id == turma_id).first()
    if not turma or turma.curso_id != curso_id_coordenador:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta turma não pertence ao seu curso.",
        )


def _validar_vinculos(
    db: Session,
    turma_id: Optional[int],
    disciplina_id: Optional[int],
    professor_id: Optional[int],
):

    if turma_id is not None and not db.query(Turma).filter(Turma.id == turma_id).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Turma não encontrada."
        )
    if (
        disciplina_id is not None
        and not db.query(Disciplina).filter(Disciplina.id == disciplina_id).first()
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Disciplina não encontrada."
        )
    if (
        professor_id is not None
        and not db.query(Professor).filter(Professor.id == professor_id).first()
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Professor não encontrado."
        )


@router.get(
    "",
    response_model=List[OfertaDisciplinaResponse],
    dependencies=[Depends(verificar_admin_ou_coordenador)],
)
def listar_ofertas(
    turma_id: Optional[int] = None,
    professor_id: Optional[int] = None,
    semestre_id: Optional[int] = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    query = db.query(OfertaDisciplina)

    curso_id_coordenador = obter_curso_id_coordenador(usuario, db)
    if curso_id_coordenador is not None:
        query = query.join(Turma, OfertaDisciplina.turma_id == Turma.id).filter(
            Turma.curso_id == curso_id_coordenador
        )

    if semestre_id:
        turma_ids = [t.id for t in db.query(Turma).filter(Turma.semestre_id == semestre_id).all()]
        query = query.filter(OfertaDisciplina.turma_id.in_(turma_ids))
    if turma_id:
        query = query.filter(OfertaDisciplina.turma_id == turma_id)
    if professor_id:
        query = query.filter(OfertaDisciplina.professor_id == professor_id)
    return query.order_by(OfertaDisciplina.turma_id, OfertaDisciplina.disciplina_id).all()


@router.get(
    "/{oferta_id}",
    response_model=OfertaDisciplinaResponse,
    dependencies=[Depends(verificar_admin_ou_coordenador)],
)
def obter_oferta(
    oferta_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    oferta = db.query(OfertaDisciplina).filter(OfertaDisciplina.id == oferta_id).first()
    if not oferta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Oferta não encontrada."
        )
    curso_id_coordenador = obter_curso_id_coordenador(usuario, db)
    _validar_turma_do_coordenador(db, oferta.turma_id, curso_id_coordenador)
    return oferta


@router.post(
    "",
    response_model=OfertaDisciplinaResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verificar_admin_ou_coordenador)],
)
def criar_oferta(
    dados: OfertaDisciplinaCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    curso_id_coordenador = obter_curso_id_coordenador(usuario, db)
    _validar_turma_do_coordenador(db, dados.turma_id, curso_id_coordenador)
    _validar_vinculos(db, dados.turma_id, dados.disciplina_id, dados.professor_id)

    existente = (
        db.query(OfertaDisciplina)
        .filter(
            OfertaDisciplina.turma_id == dados.turma_id,
            OfertaDisciplina.disciplina_id == dados.disciplina_id,
        )
        .first()
    )
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta disciplina já está ofertada para esta turma.",
        )

    nova = OfertaDisciplina(
        turma_id=dados.turma_id,
        disciplina_id=dados.disciplina_id,
        professor_id=dados.professor_id,
        carga_horaria=dados.carga_horaria,
    )
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return nova


@router.put(
    "/{oferta_id}",
    response_model=OfertaDisciplinaResponse,
    dependencies=[Depends(verificar_admin_ou_coordenador)],
)
def atualizar_oferta(
    oferta_id: int,
    dados: OfertaDisciplinaUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    oferta = db.query(OfertaDisciplina).filter(OfertaDisciplina.id == oferta_id).first()
    if not oferta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Oferta não encontrada."
        )

    curso_id_coordenador = obter_curso_id_coordenador(usuario, db)
    _validar_turma_do_coordenador(db, oferta.turma_id, curso_id_coordenador)

    update_data = dados.model_dump(exclude_unset=True)
    if "turma_id" in update_data:
        _validar_turma_do_coordenador(db, update_data["turma_id"], curso_id_coordenador)
    _validar_vinculos(
        db,
        update_data.get("turma_id"),
        update_data.get("disciplina_id"),
        update_data.get("professor_id"),
    )

    for campo, valor in update_data.items():
        setattr(oferta, campo, valor)

    db.commit()
    db.refresh(oferta)
    return oferta


@router.delete(
    "/{oferta_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(verificar_admin_ou_coordenador)],
)
def remover_oferta(
    oferta_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    oferta = db.query(OfertaDisciplina).filter(OfertaDisciplina.id == oferta_id).first()
    if not oferta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Oferta não encontrada."
        )

    curso_id_coordenador = obter_curso_id_coordenador(usuario, db)
    _validar_turma_do_coordenador(db, oferta.turma_id, curso_id_coordenador)

    db.delete(oferta)
    db.commit()
    return None
