from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.disponibilidade_turma import DisponibilidadeTurma
from app.schemas.disponibilidade_turma import DisponibilidadeTurmaCreate, DisponibilidadeTurmaResponse

# Prefix pluralizado e com hífen, seguindo o padrão de APIs REST
router = APIRouter(prefix="/api/disponibilidade-turmas", tags=["Módulo de Disponibilidade de Turmas"])

# 1. CRIAR (POST)
@router.post("", response_model=DisponibilidadeTurmaResponse, status_code=status.HTTP_201_CREATED)
def criar_disponibilidade(disponibilidade: DisponibilidadeTurmaCreate, db: Session = Depends(get_db)):
    nova_disponibilidade = DisponibilidadeTurma(**disponibilidade.model_dump())
    db.add(nova_disponibilidade)
    db.commit()
    db.refresh(nova_disponibilidade)
    return nova_disponibilidade

# 2. LISTAR (GET)
@router.get("", response_model=List[DisponibilidadeTurmaResponse])
def listar_disponibilidades(db: Session = Depends(get_db)):
    return db.query(DisponibilidadeTurma).all()

# 3. ATUALIZAR (PUT)
@router.put("/{disp_id}", response_model=DisponibilidadeTurmaResponse)
def atualizar_disponibilidade(disp_id: int, disponibilidade_atualizada: DisponibilidadeTurmaCreate, db: Session = Depends(get_db)):
    db_disp = db.query(DisponibilidadeTurma).filter(DisponibilidadeTurma.id == disp_id).first()
    
    if not db_disp:
        raise HTTPException(status_code=404, detail="Disponibilidade não encontrada.")
    
    # Atualiza apenas os campos passados
    for key, value in disponibilidade_atualizada.model_dump().items():
        setattr(db_disp, key, value)
        
    db.commit()
    db.refresh(db_disp)
    return db_disp

# 4. EXCLUIR (DELETE)
@router.delete("/{disp_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_disponibilidade(disp_id: int, db: Session = Depends(get_db)):
    db_disp = db.query(DisponibilidadeTurma).filter(DisponibilidadeTurma.id == disp_id).first()
    
    if not db_disp:
        raise HTTPException(status_code=404, detail="Disponibilidade não encontrada.")
    
    db.delete(db_disp)
    db.commit()
    return None