from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.deps import obter_curso_id_coordenador, obter_usuario_atual
from app.models.turma import Turma
from app.models.usuario import Usuario
from app.schemas.turma import TurmaCreate, TurmaResponse

router = APIRouter(prefix="/api/turmas", tags=["Módulo de Turmas"])


# 1. CRIAR (POST)
@router.post("", response_model=TurmaResponse, status_code=status.HTTP_201_CREATED)
def criar_turma(
    turma: TurmaCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    dados = turma.model_dump()
    curso_id_coordenador = obter_curso_id_coordenador(usuario, db)
    if curso_id_coordenador is not None:
        # Coordenador só cria turmas dentro do próprio curso, independente
        # do que foi enviado no corpo da requisição.
        dados["curso_id"] = curso_id_coordenador

    nova_turma = Turma(**dados)
    db.add(nova_turma)
    db.commit()
    db.refresh(nova_turma)
    return nova_turma


# 2. LER / LISTAR (GET)
@router.get("", response_model=List[TurmaResponse])
def listar_turmas(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    query = db.query(Turma)
    curso_id_coordenador = obter_curso_id_coordenador(usuario, db)
    if curso_id_coordenador is not None:
        query = query.filter(Turma.curso_id == curso_id_coordenador)
    return query.all()


# 3. ATUALIZAR (PUT)
@router.put("/{turma_id}", response_model=TurmaResponse)
def atualizar_turma(
    turma_id: int,
    turma_atualizada: TurmaCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    db_turma = db.query(Turma).filter(Turma.id == turma_id).first()

    if not db_turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada.")

    curso_id_coordenador = obter_curso_id_coordenador(usuario, db)
    if curso_id_coordenador is not None and db_turma.curso_id != curso_id_coordenador:
        raise HTTPException(status_code=403, detail="Esta turma não pertence ao seu curso.")

    dados = turma_atualizada.model_dump()
    if curso_id_coordenador is not None:
        dados["curso_id"] = curso_id_coordenador

    for key, value in dados.items():
        setattr(db_turma, key, value)

    db.commit()
    db.refresh(db_turma)
    return db_turma


# 4. DELETAR (DELETE)
@router.delete("/{turma_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_turma(
    turma_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    db_turma = db.query(Turma).filter(Turma.id == turma_id).first()

    if not db_turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada.")

    curso_id_coordenador = obter_curso_id_coordenador(usuario, db)
    if curso_id_coordenador is not None and db_turma.curso_id != curso_id_coordenador:
        raise HTTPException(status_code=403, detail="Esta turma não pertence ao seu curso.")

    db.delete(db_turma)
    db.commit()
    return None
