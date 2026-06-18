from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.disciplina import Disciplina
from app.schemas.disciplina import DisciplinaCreate, DisciplinaResponse

# Mantemos o prefix normal
router = APIRouter(prefix="/api/disciplinas", tags=["Módulo de Disciplinas"])

# 1. CRIAR (POST) - Sem a barra! (Fica exatamente /api/disciplinas)
@router.post("", response_model=DisciplinaResponse, status_code=status.HTTP_201_CREATED)
def criar_disciplina(disciplina: DisciplinaCreate, db: Session = Depends(get_db)):
    nova_disciplina = Disciplina(**disciplina.dict())
    db.add(nova_disciplina)
    db.commit()
    db.refresh(nova_disciplina)
    return nova_disciplina

# 2. LISTAR (GET) - Sem a barra! (Fica exatamente /api/disciplinas)
@router.get("", response_model=List[DisciplinaResponse])
def listar_disciplinas(db: Session = Depends(get_db)):
    return db.query(Disciplina).all()

# 3. ATUALIZAR (PUT)
@router.put("/{disciplina_id}", response_model=DisciplinaResponse)
def atualizar_disciplina(disciplina_id: int, disciplina_atualizada: DisciplinaCreate, db: Session = Depends(get_db)):
    db_disciplina = db.query(Disciplina).filter(Disciplina.id == disciplina_id).first()
    if not db_disciplina:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada.")
    
    for key, value in disciplina_atualizada.dict().items():
        setattr(db_disciplina, key, value)
        
    db.commit()
    db.refresh(db_disciplina)
    return db_disciplina

# 4. EXCLUIR (DELETE)
@router.delete("/{disciplina_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_disciplina(disciplina_id: int, db: Session = Depends(get_db)):
    db_disciplina = db.query(Disciplina).filter(Disciplina.id == disciplina_id).first()
    if not db_disciplina:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada.")
    
    db.delete(db_disciplina)
    db.commit()
    return None