from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.deps import obter_curso_id_coordenador, obter_usuario_atual
from app.models.disciplina import Disciplina
from app.models.usuario import Usuario
from app.schemas.disciplina import DisciplinaCreate, DisciplinaResponse

router = APIRouter(prefix="/api/disciplinas", tags=["Módulo de Disciplinas"])


# 1. CRIAR (POST)
@router.post("", response_model=DisciplinaResponse, status_code=status.HTTP_201_CREATED)
def criar_disciplina(
    disciplina: DisciplinaCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    dados = disciplina.model_dump()
    curso_id_coordenador = obter_curso_id_coordenador(usuario, db)
    if curso_id_coordenador is not None:
        dados["curso_id"] = curso_id_coordenador

    nova_disciplina = Disciplina(**dados)
    db.add(nova_disciplina)
    db.commit()
    db.refresh(nova_disciplina)
    return nova_disciplina


# 2. LISTAR (GET)
@router.get("", response_model=List[DisciplinaResponse])
def listar_disciplinas(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    query = db.query(Disciplina)
    curso_id_coordenador = obter_curso_id_coordenador(usuario, db)
    if curso_id_coordenador is not None:
        query = query.filter(Disciplina.curso_id == curso_id_coordenador)
    return query.all()


# 3. ATUALIZAR (PUT)
@router.put("/{disciplina_id}", response_model=DisciplinaResponse)
def atualizar_disciplina(
    disciplina_id: int,
    disciplina_atualizada: DisciplinaCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    db_disciplina = db.query(Disciplina).filter(Disciplina.id == disciplina_id).first()
    if not db_disciplina:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada.")

    curso_id_coordenador = obter_curso_id_coordenador(usuario, db)
    if curso_id_coordenador is not None and db_disciplina.curso_id != curso_id_coordenador:
        raise HTTPException(status_code=403, detail="Esta disciplina não pertence ao seu curso.")

    dados = disciplina_atualizada.model_dump()
    if curso_id_coordenador is not None:
        dados["curso_id"] = curso_id_coordenador

    for key, value in dados.items():
        setattr(db_disciplina, key, value)

    db.commit()
    db.refresh(db_disciplina)
    return db_disciplina


# 4. EXCLUIR (DELETE)
@router.delete("/{disciplina_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_disciplina(
    disciplina_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    db_disciplina = db.query(Disciplina).filter(Disciplina.id == disciplina_id).first()
    if not db_disciplina:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada.")

    curso_id_coordenador = obter_curso_id_coordenador(usuario, db)
    if curso_id_coordenador is not None and db_disciplina.curso_id != curso_id_coordenador:
        raise HTTPException(status_code=403, detail="Esta disciplina não pertence ao seu curso.")

    db.delete(db_disciplina)
    db.commit()
    return None
