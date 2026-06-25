from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.professor import Professor
from app.models.usuario import Usuario
from app.schemas.professor import (
    ProfessorCreate, ProfessorUpdate, ProfessorResponse,
    SituacaoProfessorResponse, SituacaoProfessorUpdate,
)
from app.api.routers.auth import verificar_admin, verificar_admin_ou_coordenador, obter_usuario_atual

router = APIRouter(
    prefix="/api/professores",
    tags=["Módulo de Cadastros Base - Professores"]
)

TIPO_PROFESSOR = "PROFESSOR"


@router.get(
    "",
    response_model=List[ProfessorResponse],
    dependencies=[Depends(verificar_admin_ou_coordenador)]
)
def listar_professores(db: Session = Depends(get_db)):
    """Lista todos os professores cadastrados."""
    return db.query(Professor).all()


@router.get(
    "/{professor_id}",
    response_model=ProfessorResponse,
    dependencies=[Depends(verificar_admin_ou_coordenador)]
)
def obter_professor(professor_id: int, db: Session = Depends(get_db)):
    """Obtém os detalhes de um professor específico."""
    db_professor = db.query(Professor).filter(Professor.id == professor_id).first()
    if not db_professor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professor não encontrado."
        )
    return db_professor


@router.post(
    "",
    response_model=ProfessorResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verificar_admin)]
)
def criar_professor(prof_in: ProfessorCreate, db: Session = Depends(get_db)):
    """Cria um novo professor (docente) no sistema.

    Se `password` for informado, cria também uma conta de login em `usuarios`
    (tipo PROFESSOR) e vincula via `usuario_id` — assim o professor já consegue
    entrar no sistema, igual ao fluxo do coordenador.
    """

    # E-mail deve ser único entre os professores
    if db.query(Professor).filter(Professor.email == prof_in.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um professor com este e-mail."
        )

    usuario_id = None
    if prof_in.password:
        # O e-mail também precisa ser único na tabela de login.
        if db.query(Usuario).filter(Usuario.email == prof_in.email).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este e-mail já está em uso."
            )
        usuario = Usuario(
            nome=prof_in.nome,
            email=prof_in.email,
            senha=get_password_hash(prof_in.password),
            tipo=TIPO_PROFESSOR,
        )
        db.add(usuario)
        db.flush()  # garante usuario.id para o vínculo
        usuario_id = usuario.id

    novo_professor = Professor(
        usuario_id=usuario_id,
        nome=prof_in.nome,
        email=prof_in.email,
        regime_trabalho=prof_in.regime_trabalho,
        area=prof_in.area,
        carga_maxima=prof_in.carga_maxima
    )

    db.add(novo_professor)
    db.commit()
    db.refresh(novo_professor)
    return novo_professor


@router.put(
    "/{professor_id}",
    response_model=ProfessorResponse,
    dependencies=[Depends(verificar_admin)]
)
def atualizar_professor(professor_id: int, prof_in: ProfessorUpdate, db: Session = Depends(get_db)):
    """Modifica informações do professor."""
    
    db_professor = db.query(Professor).filter(Professor.id == professor_id).first()
    if not db_professor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professor não encontrado."
        )

    # Atualiza apenas os campos fornecidos (a senha é tratada à parte).
    update_data = prof_in.model_dump(exclude_unset=True)
    nova_senha = update_data.pop("password", None)
    for campo, valor in update_data.items():
        setattr(db_professor, campo, valor)

    # Mantém a conta de login (se houver) em sincronia. Se ainda não existir e
    # uma senha foi informada, cria o acesso agora.
    usuario = (
        db.query(Usuario).filter(Usuario.id == db_professor.usuario_id).first()
        if db_professor.usuario_id else None
    )
    if usuario is None and nova_senha:
        if db.query(Usuario).filter(Usuario.email == db_professor.email).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este e-mail já está em uso."
            )
        usuario = Usuario(
            nome=db_professor.nome,
            email=db_professor.email,
            senha=get_password_hash(nova_senha),
            tipo=TIPO_PROFESSOR,
        )
        db.add(usuario)
        db.flush()
        db_professor.usuario_id = usuario.id
    elif usuario is not None:
        usuario.nome = db_professor.nome
        usuario.email = db_professor.email
        if nova_senha:
            usuario.senha = get_password_hash(nova_senha)

    db.commit()
    db.refresh(db_professor)
    return db_professor


@router.delete(
    "/{professor_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(verificar_admin)]
)
def deletar_professor(professor_id: int, db: Session = Depends(get_db)):
    """Remove um professor do sistema."""
    
    db_professor = db.query(Professor).filter(Professor.id == professor_id).first()
    if not db_professor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professor não encontrado."
        )

    # Remove também a conta de login vinculada, se houver.
    if db_professor.usuario_id:
        usuario = db.query(Usuario).filter(Usuario.id == db_professor.usuario_id).first()
        if usuario:
            db.delete(usuario)

    db.delete(db_professor)
    db.commit()
    return None


# ==========================
# SITUAÇÃO DO PROFESSOR
# ==========================

@router.get(
    "/{professor_id}/situacao",
    response_model=SituacaoProfessorResponse,
    dependencies=[Depends(obter_usuario_atual)],
)
def obter_situacao(professor_id: int, db: Session = Depends(get_db)):
    prof = db.query(Professor).filter(Professor.id == professor_id).first()
    if not prof:
        raise HTTPException(status_code=404, detail="Professor não encontrado.")
    return SituacaoProfessorResponse(
        situacao=prof.situacao or "ativo",
        carga_disponivel=prof.carga_disponivel if prof.carga_disponivel is not None else (prof.carga_maxima or 0),
        data_inicio=prof.data_inicio_situacao,
        data_fim=prof.data_fim_situacao,
        observacao=prof.observacao_situacao,
    )


@router.put(
    "/{professor_id}/situacao",
    response_model=SituacaoProfessorResponse,
    dependencies=[Depends(obter_usuario_atual)],
)
def atualizar_situacao(
    professor_id: int,
    dados: SituacaoProfessorUpdate,
    db: Session = Depends(get_db),
):
    prof = db.query(Professor).filter(Professor.id == professor_id).first()
    if not prof:
        raise HTTPException(status_code=404, detail="Professor não encontrado.")

    prof.situacao = dados.situacao
    prof.carga_disponivel = dados.carga_disponivel
    prof.data_inicio_situacao = dados.data_inicio
    prof.data_fim_situacao = dados.data_fim
    prof.observacao_situacao = dados.observacao
    db.commit()
    db.refresh(prof)

    return SituacaoProfessorResponse(
        situacao=prof.situacao,
        carga_disponivel=prof.carga_disponivel,
        data_inicio=prof.data_inicio_situacao,
        data_fim=prof.data_fim_situacao,
        observacao=prof.observacao_situacao,
    )
