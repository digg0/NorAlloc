from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.deps import obter_usuario_atual
from app.core.security import get_password_hash
from app.models.coordenador import Coordenador
from app.models.professor import Professor
from app.models.usuario import Usuario
from app.schemas.coordenador import CoordenadorCreate, CoordenadorUpdate, CoordenadorResponse
from app.api.routers.auth import verificar_admin

router = APIRouter(prefix="/api/coordenadores", tags=["Módulo de Cadastros Base - Coordenadores"])


def _obter_ou_criar_usuario_do_professor(professor: Professor, db: Session) -> Usuario:
    """Garante que o professor tenha uma conta de login, criando uma se
    necessário (e-mail é obrigatório nesse caso)."""
    if professor.usuario_id:
        usuario = db.query(Usuario).filter(Usuario.id == professor.usuario_id).first()
        if usuario:
            return usuario
    if not professor.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este professor não tem e-mail cadastrado; não é possível criar o login de coordenador.",
        )
    usuario = db.query(Usuario).filter(Usuario.email == professor.email).first()
    if not usuario:
        usuario = Usuario(nome=professor.nome, email=professor.email, senha=get_password_hash("trocar123"), tipo="PROFESSOR")
        db.add(usuario)
        db.flush()
    professor.usuario_id = usuario.id
    return usuario


@router.get("/me", response_model=CoordenadorResponse)
def meu_coordenador(usuario: Usuario = Depends(obter_usuario_atual), db: Session = Depends(get_db)):
    """Retorna o registro de coordenador do usuário logado (usado pelo
    frontend para travar o curso nos formulários de turma/disciplina/oferta)."""
    if usuario.tipo != "COORDENADOR":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuário não é coordenador.")
    coordenador = db.query(Coordenador).filter(Coordenador.usuario_id == usuario.id, Coordenador.ativo == True).first()
    if not coordenador:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coordenador não encontrado.")
    return coordenador


@router.get("", response_model=List[CoordenadorResponse], dependencies=[Depends(verificar_admin)])
def listar_coordenadores(db: Session = Depends(get_db)):
    """Lista todos os coordenadores ativos (sempre docentes reais — ver professor_id)."""
    return db.query(Coordenador).filter(Coordenador.ativo == True).all()


@router.post("", response_model=CoordenadorResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(verificar_admin)])
def criar_coordenador(coord_in: CoordenadorCreate, db: Session = Depends(get_db)):
    """Torna um professor já cadastrado coordenador de um curso.

    Reaproveita a conta de login do professor (ou cria uma, se ele ainda
    não tiver), passando o tipo dela para COORDENADOR — coordenadores são
    docentes da instituição, não contas avulsas.
    """
    professor = db.query(Professor).filter(Professor.id == coord_in.professor_id).first()
    if not professor:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Professor não encontrado.")

    if db.query(Coordenador).filter(Coordenador.professor_id == professor.id, Coordenador.ativo == True).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este professor já é coordenador.")

    usuario = _obter_ou_criar_usuario_do_professor(professor, db)
    usuario.tipo = "COORDENADOR"
    senha_hash = get_password_hash(coord_in.password) if coord_in.password else usuario.senha
    usuario.senha = senha_hash

    novo_coord = Coordenador(
        nome=professor.nome,
        email=professor.email,
        curso_id=coord_in.curso_id,
        professor_id=professor.id,
        hashed_password=senha_hash,
        usuario_id=usuario.id,
    )

    db.add(novo_coord)
    db.commit()
    db.refresh(novo_coord)
    return novo_coord


@router.put("/{coordenador_id}", response_model=CoordenadorResponse, dependencies=[Depends(verificar_admin)])
def atualizar_coordenador(coordenador_id: int, coord_in: CoordenadorUpdate, db: Session = Depends(get_db)):
    """Altera o curso do coordenador, a senha, ou substitui qual professor
    coordena o curso (revertendo o login do professor anterior para
    PROFESSOR e promovendo o novo para COORDENADOR)."""

    db_coord = db.query(Coordenador).filter(Coordenador.id == coordenador_id, Coordenador.ativo == True).first()
    if not db_coord:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coordenador não encontrado.")

    update_data = coord_in.model_dump(exclude_unset=True)

    if "curso_id" in update_data:
        db_coord.curso_id = update_data["curso_id"]

    if "professor_id" in update_data and update_data["professor_id"] != db_coord.professor_id:
        novo_professor = db.query(Professor).filter(Professor.id == update_data["professor_id"]).first()
        if not novo_professor:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Professor não encontrado.")
        if db.query(Coordenador).filter(Coordenador.professor_id == novo_professor.id, Coordenador.ativo == True).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este professor já é coordenador.")

        usuario_antigo = (
            db.query(Usuario).filter(Usuario.id == db_coord.usuario_id).first()
            if db_coord.usuario_id
            else None
        )
        if usuario_antigo:
            usuario_antigo.tipo = "PROFESSOR"

        novo_usuario = _obter_ou_criar_usuario_do_professor(novo_professor, db)
        novo_usuario.tipo = "COORDENADOR"

        db_coord.professor_id = novo_professor.id
        db_coord.nome = novo_professor.nome
        db_coord.email = novo_professor.email
        db_coord.usuario_id = novo_usuario.id
        db_coord.hashed_password = novo_usuario.senha

    usuario = (
        db.query(Usuario).filter(Usuario.id == db_coord.usuario_id).first()
        if db_coord.usuario_id
        else None
    )
    if "password" in update_data and update_data["password"]:
        senha_hash = get_password_hash(update_data["password"])
        db_coord.hashed_password = senha_hash
        if usuario:
            usuario.senha = senha_hash

    db.commit()
    db.refresh(db_coord)
    return db_coord


@router.delete("/{coordenador_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(verificar_admin)])
def deletar_coordenador(coordenador_id: int, db: Session = Depends(get_db)):
    """Remove o acesso do coordenador (Soft delete para auditoria).

    O professor continua cadastrado — só deixa de ser coordenador; o login
    dele volta a ser de PROFESSOR.
    """

    db_coord = db.query(Coordenador).filter(Coordenador.id == coordenador_id, Coordenador.ativo == True).first()
    if not db_coord:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coordenador não encontrado.")

    if db_coord.usuario_id:
        usuario = db.query(Usuario).filter(Usuario.id == db_coord.usuario_id).first()
        if usuario:
            usuario.tipo = "PROFESSOR"

    db_coord.ativo = False
    db.commit()
    return None
