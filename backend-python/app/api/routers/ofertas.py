from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.oferta_disciplina import OfertaDisciplina
from app.models.turma import Turma
from app.models.disciplina import Disciplina
from app.models.professor import Professor
from app.schemas.oferta_disciplina import (
    OfertaDisciplinaCreate,
    OfertaDisciplinaUpdate,
    OfertaDisciplinaResponse,
)

router = APIRouter(
    prefix="/api/ofertas", tags=["Módulo de Cadastros Base - Ofertas de Disciplina"]
)


def verificar_admin():
    pass  


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
    dependencies=[Depends(verificar_admin)],
)
def listar_ofertas(
    turma_id: Optional[int] = None,
    professor_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    
    query = db.query(OfertaDisciplina)
    if turma_id:
        query = query.filter(OfertaDisciplina.turma_id == turma_id)
    if professor_id:
        query = query.filter(OfertaDisciplina.professor_id == professor_id)
    return query.order_by(OfertaDisciplina.turma_id, OfertaDisciplina.disciplina_id).all()


@router.get(
    "/{oferta_id}",
    response_model=OfertaDisciplinaResponse,
    dependencies=[Depends(verificar_admin)],
)
def obter_oferta(oferta_id: int, db: Session = Depends(get_db)):
    
    oferta = db.query(OfertaDisciplina).filter(OfertaDisciplina.id == oferta_id).first()
    if not oferta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Oferta não encontrada."
        )
    return oferta


@router.post(
    "",
    response_model=OfertaDisciplinaResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verificar_admin)],
)
def criar_oferta(dados: OfertaDisciplinaCreate, db: Session = Depends(get_db)):
    
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
    dependencies=[Depends(verificar_admin)],
)
def atualizar_oferta(
    oferta_id: int, dados: OfertaDisciplinaUpdate, db: Session = Depends(get_db)
):
    
    oferta = db.query(OfertaDisciplina).filter(OfertaDisciplina.id == oferta_id).first()
    if not oferta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Oferta não encontrada."
        )

    update_data = dados.model_dump(exclude_unset=True)
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
    dependencies=[Depends(verificar_admin)],
)
def remover_oferta(oferta_id: int, db: Session = Depends(get_db)):
    oferta = db.query(OfertaDisciplina).filter(OfertaDisciplina.id == oferta_id).first()
    if not oferta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Oferta não encontrada."
        )

    db.delete(oferta)
    db.commit()
    return None
