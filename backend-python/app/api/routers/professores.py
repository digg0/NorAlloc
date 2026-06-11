from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.professor import Professor
from app.schemas.professor import ProfessorCreate, ProfessorUpdate, ProfessorResponse

router = APIRouter(prefix="/api/professores", tags=["Módulo de Cadastros Base - Professores"])

# ---------------------------------------------------------
# MOCK DA AUTENTICAÇÃO (A substituir pelo JWT futuramente)
def verificar_admin():
    pass # Permite testar os endpoints agora
# ---------------------------------------------------------

@router.get("", response_model=List[ProfessorResponse], dependencies=[Depends(verificar_admin)])
def listar_professores(db: Session = Depends(get_db)):
    """Lista todos os professores cadastrados."""
    return db.query(Professor).all()


@router.get("/{professor_id}", response_model=ProfessorResponse, dependencies=[Depends(verificar_admin)])
def obter_professor(professor_id: int, db: Session = Depends(get_db)):
    """Obtém os detalhes de um professor específico."""
    db_professor = db.query(Professor).filter(Professor.id == professor_id).first()
    if not db_professor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professor não encontrado."
        )
    return db_professor


@router.post("", response_model=ProfessorResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(verificar_admin)])
def criar_professor(prof_in: ProfessorCreate, db: Session = Depends(get_db)):
    """Cria um novo professor no sistema."""
    
    # Verifica se o usuário existe
    from app.models.usuario import Usuario
    db_usuario = db.query(Usuario).filter(Usuario.id == prof_in.usuario_id).first()
    if not db_usuario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário especificado não existe."
        )
    
    # Verifica se o professor já existe para esse usuário
    db_professor = db.query(Professor).filter(Professor.usuario_id == prof_in.usuario_id).first()
    if db_professor:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um professor cadastrado para este usuário."
        )

    novo_professor = Professor(
        nome=prof_in.nome,
        usuario_id=prof_in.usuario_id,
        regime_trabalho=prof_in.regime_trabalho,
        carga_maxima=prof_in.carga_maxima
    )
    
    db.add(novo_professor)
    db.commit()
    db.refresh(novo_professor)
    return novo_professor


@router.put("/{professor_id}", response_model=ProfessorResponse, dependencies=[Depends(verificar_admin)])
def atualizar_professor(professor_id: int, prof_in: ProfessorUpdate, db: Session = Depends(get_db)):
    """Modifica informações do professor."""
    
    db_professor = db.query(Professor).filter(Professor.id == professor_id).first()
    if not db_professor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professor não encontrado."
        )

    # Atualiza apenas os campos fornecidos
    update_data = prof_in.model_dump(exclude_unset=True)
    for campo, valor in update_data.items():
        setattr(db_professor, campo, valor)

    db.commit()
    db.refresh(db_professor)
    return db_professor


@router.delete("/{professor_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(verificar_admin)])
def deletar_professor(professor_id: int, db: Session = Depends(get_db)):
    """Remove um professor do sistema."""
    
    db_professor = db.query(Professor).filter(Professor.id == professor_id).first()
    if not db_professor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professor não encontrado."
        )

    db.delete(db_professor)
    db.commit()
    return None
