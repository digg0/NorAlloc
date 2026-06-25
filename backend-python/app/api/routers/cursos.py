from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.curso import Curso
from app.schemas.curso import CursoCreate, CursoResponse
from app.api.routers.auth import obter_usuario_atual, verificar_admin_ou_coordenador

router = APIRouter(prefix="/api/cursos", tags=["Cursos"])


@router.post("", response_model=CursoResponse, status_code=201, dependencies=[Depends(verificar_admin_ou_coordenador)])
def criar_curso(curso: CursoCreate, db: Session = Depends(get_db)):
    curso_existente = db.query(Curso).filter(Curso.nome == curso.nome.upper()).first()
    if curso_existente:
        raise HTTPException(status_code=400, detail="Curso já cadastrado")

    novo_curso = Curso(nome=curso.nome.upper(), nivel=curso.nivel)
    try:
        db.add(novo_curso)
        db.commit()
        db.refresh(novo_curso)
        return novo_curso
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao criar curso")


@router.get("", response_model=list[CursoResponse], dependencies=[Depends(obter_usuario_atual)])
def listar_cursos(db: Session = Depends(get_db)):
    return db.query(Curso).all()


@router.get("/{nome}", response_model=CursoResponse, dependencies=[Depends(obter_usuario_atual)])
def buscar_por_nome(nome: str, db: Session = Depends(get_db)):
    curso = db.query(Curso).filter(Curso.nome == nome.upper()).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso não encontrado")
    return curso
