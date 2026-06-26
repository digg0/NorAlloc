from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.disponibilidade_turma import DisponibilidadeTurma
from app.schemas.disponibilidade_turma import DisponibilidadeTurmaCreate, DisponibilidadeTurmaResponse
from app.api.routers.auth import obter_usuario_atual, verificar_admin_ou_coordenador

router = APIRouter(prefix="/api/disponibilidade-turmas", tags=["Módulo de Disponibilidade de Turmas"])


@router.post("", response_model=DisponibilidadeTurmaResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(verificar_admin_ou_coordenador)])
def criar_disponibilidade(disponibilidade: DisponibilidadeTurmaCreate, db: Session = Depends(get_db)):
    nova_disponibilidade = DisponibilidadeTurma(**disponibilidade.model_dump())
    db.add(nova_disponibilidade)
    db.commit()
    db.refresh(nova_disponibilidade)
    return nova_disponibilidade


@router.get("", response_model=List[DisponibilidadeTurmaResponse], dependencies=[Depends(obter_usuario_atual)])
def listar_disponibilidades(db: Session = Depends(get_db)):
    return db.query(DisponibilidadeTurma).all()


@router.put("/{disp_id}", response_model=DisponibilidadeTurmaResponse, dependencies=[Depends(verificar_admin_ou_coordenador)])
def atualizar_disponibilidade(disp_id: int, disponibilidade_atualizada: DisponibilidadeTurmaCreate, db: Session = Depends(get_db)):
    db_disp = db.query(DisponibilidadeTurma).filter(DisponibilidadeTurma.id == disp_id).first()
    if not db_disp:
        raise HTTPException(status_code=404, detail="Disponibilidade não encontrada.")

    for key, value in disponibilidade_atualizada.model_dump().items():
        setattr(db_disp, key, value)

    db.commit()
    db.refresh(db_disp)
    return db_disp


@router.delete("/{disp_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(verificar_admin_ou_coordenador)])
def deletar_disponibilidade(disp_id: int, db: Session = Depends(get_db)):
    db_disp = db.query(DisponibilidadeTurma).filter(DisponibilidadeTurma.id == disp_id).first()
    if not db_disp:
        raise HTTPException(status_code=404, detail="Disponibilidade não encontrada.")

    db.delete(db_disp)
    db.commit()
    return None
