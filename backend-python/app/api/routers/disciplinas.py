from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.disciplina import Disciplina
from app.schemas.disciplina import DisciplinaCreate, DisciplinaResponse
from app.api.routers.auth import obter_usuario_atual, verificar_admin_ou_coordenador

router = APIRouter(prefix="/api/disciplinas", tags=["Módulo de Disciplinas"])


@router.post("", response_model=DisciplinaResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(verificar_admin_ou_coordenador)])
def criar_disciplina(disciplina: DisciplinaCreate, db: Session = Depends(get_db)):
    nova_disciplina = Disciplina(**disciplina.dict())
    db.add(nova_disciplina)
    db.commit()
    db.refresh(nova_disciplina)
    return nova_disciplina


@router.get("", response_model=List[DisciplinaResponse], dependencies=[Depends(obter_usuario_atual)])
def listar_disciplinas(db: Session = Depends(get_db)):
    return db.query(Disciplina).all()


@router.put("/{disciplina_id}", response_model=DisciplinaResponse, dependencies=[Depends(verificar_admin_ou_coordenador)])
def atualizar_disciplina(disciplina_id: int, disciplina_atualizada: DisciplinaCreate, db: Session = Depends(get_db)):
    db_disciplina = db.query(Disciplina).filter(Disciplina.id == disciplina_id).first()
    if not db_disciplina:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada.")

    for key, value in disciplina_atualizada.dict().items():
        setattr(db_disciplina, key, value)

    db.commit()
    db.refresh(db_disciplina)
    return db_disciplina


@router.delete("/{disciplina_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(verificar_admin_ou_coordenador)])
def deletar_disciplina(disciplina_id: int, db: Session = Depends(get_db)):
    db_disciplina = db.query(Disciplina).filter(Disciplina.id == disciplina_id).first()
    if not db_disciplina:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada.")

    db.delete(db_disciplina)
    db.commit()
    return None
