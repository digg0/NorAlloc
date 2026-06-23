from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.turma import Turma # Confirme se o nome do arquivo model e da classe são esses mesmos
from app.schemas.turma import TurmaCreate, TurmaResponse

router = APIRouter(prefix="/api/turmas", tags=["Módulo de Turmas"])

# 1. CRIAR (POST)
@router.post("", response_model=TurmaResponse, status_code=status.HTTP_201_CREATED)
def criar_turma(turma: TurmaCreate, db: Session = Depends(get_db)):
    nova_turma = Turma(**turma.model_dump())
    db.add(nova_turma)
    db.commit()
    db.refresh(nova_turma)
    return nova_turma

# 2. LER / LISTAR (GET)
@router.get("", response_model=List[TurmaResponse])
def listar_turmas(db: Session = Depends(get_db)):
    return db.query(Turma).all()

# 3. ATUALIZAR (PUT)
@router.put("/{turma_id}", response_model=TurmaResponse)
def atualizar_turma(turma_id: int, turma_atualizada: TurmaCreate, db: Session = Depends(get_db)):
    db_turma = db.query(Turma).filter(Turma.id == turma_id).first()
    
    if not db_turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada.")
    
    for key, value in turma_atualizada.model_dump().items():
        setattr(db_turma, key, value)
        
    db.commit()
    db.refresh(db_turma)
    return db_turma

# 4. DELETAR (DELETE)
@router.delete("/{turma_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_turma(turma_id: int, db: Session = Depends(get_db)):
    db_turma = db.query(Turma).filter(Turma.id == turma_id).first()
    
    if not db_turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada.")
    
    db.delete(db_turma)
    db.commit()
    return None