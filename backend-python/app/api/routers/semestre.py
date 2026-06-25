from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.semestre import Semestre
from app.schemas.semestre import SemestreCreate, SemestreUpdate, SemestreResponse
from app.api.routers.auth import obter_usuario_atual, verificar_admin_ou_coordenador

router = APIRouter(
    prefix="/api/semestres",
    tags=["Módulo de Cadastros Base - Semestres"],
)


@router.get("", response_model=List[SemestreResponse], dependencies=[Depends(obter_usuario_atual)])
def listar_semestres(db: Session = Depends(get_db)):
    return db.query(Semestre).all()


@router.get("/{semestre_id}", response_model=SemestreResponse, dependencies=[Depends(obter_usuario_atual)])
def buscar_semestre(semestre_id: int, db: Session = Depends(get_db)):
    semestre = db.query(Semestre).filter(Semestre.id == semestre_id).first()
    if not semestre:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Semestre não encontrado.")
    return semestre


@router.post("", response_model=SemestreResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(verificar_admin_ou_coordenador)])
def criar_semestre(semestre_in: SemestreCreate, db: Session = Depends(get_db)):
    semestre_existente = db.query(Semestre).filter(Semestre.nome == semestre_in.nome).first()
    if semestre_existente:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Já existe um semestre com este nome.")

    novo_semestre = Semestre(
        nome=semestre_in.nome,
        data_inicio=semestre_in.data_inicio,
        data_fim=semestre_in.data_fim,
        status=semestre_in.status,
    )
    db.add(novo_semestre)
    db.commit()
    db.refresh(novo_semestre)
    return novo_semestre


@router.put("/{semestre_id}", response_model=SemestreResponse, dependencies=[Depends(verificar_admin_ou_coordenador)])
def atualizar_semestre(semestre_id: int, semestre_in: SemestreUpdate, db: Session = Depends(get_db)):
    db_semestre = db.query(Semestre).filter(Semestre.id == semestre_id).first()
    if not db_semestre:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Semestre não encontrado.")

    for campo, valor in semestre_in.model_dump(exclude_unset=True).items():
        setattr(db_semestre, campo, valor)

    db.commit()
    db.refresh(db_semestre)
    return db_semestre


@router.delete("/{semestre_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(verificar_admin_ou_coordenador)])
def deletar_semestre(semestre_id: int, db: Session = Depends(get_db)):
    db_semestre = db.query(Semestre).filter(Semestre.id == semestre_id).first()
    if not db_semestre:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Semestre não encontrado.")

    db.delete(db_semestre)
    db.commit()
    return None
