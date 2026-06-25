from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.coordenador import Coordenador
from app.models.usuario import Usuario
from app.schemas.coordenador import CoordenadorCreate, CoordenadorUpdate, CoordenadorResponse
from app.api.routers.auth import verificar_admin

TIPO_COORDENADOR = "COORDENADOR"

router = APIRouter(prefix="/api/coordenadores", tags=["Módulo de Cadastros Base - Coordenadores"])

@router.get("", response_model=List[CoordenadorResponse], dependencies=[Depends(verificar_admin)])
def listar_coordenadores(db: Session = Depends(get_db)):
    """Lista todos os coordenadores ativos."""
    return db.query(Coordenador).filter(Coordenador.ativo == True).all()


@router.post("", response_model=CoordenadorResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(verificar_admin)])
def criar_coordenador(coord_in: CoordenadorCreate, db: Session = Depends(get_db)):
    """Cria o acesso de login para um coordenador e vincula-o a um curso.

    Além da linha em `coordenadores`, cria também um registro em `usuarios`
    (tipo COORDENADOR), que é a tabela usada pelo login (/api/auth/login).
    Sem isso o coordenador recém-criado receberia 401 ao tentar logar.
    """

    # O e-mail precisa ser único nas duas tabelas (cadastro e login).
    if db.query(Coordenador).filter(Coordenador.email == coord_in.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este e-mail já está em uso.")
    if db.query(Usuario).filter(Usuario.email == coord_in.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este e-mail já está em uso.")

    senha_hash = get_password_hash(coord_in.password)

    novo_coord = Coordenador(
        nome=coord_in.nome,
        email=coord_in.email,
        curso_id=coord_in.curso_id,
        hashed_password=senha_hash
    )
    db.add(novo_coord)

    # Cria o acesso de login (fonte da verdade da autenticação).
    db.add(Usuario(
        nome=coord_in.nome,
        email=coord_in.email,
        senha=senha_hash,
        tipo=TIPO_COORDENADOR,
    ))

    db.commit()
    db.refresh(novo_coord)
    return novo_coord


@router.put("/{coordenador_id}", response_model=CoordenadorResponse, dependencies=[Depends(verificar_admin)])
def atualizar_coordenador(coordenador_id: int, coord_in: CoordenadorUpdate, db: Session = Depends(get_db)):
    """Modifica informações do coordenador ou altera o curso associado."""
    
    db_coord = db.query(Coordenador).filter(Coordenador.id == coordenador_id, Coordenador.ativo == True).first()
    if not db_coord:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coordenador não encontrado.")

    # Localiza o usuário de login vinculado pelo e-mail ANTES de qualquer alteração.
    email_antigo = db_coord.email
    usuario = (
        db.query(Usuario)
        .filter(Usuario.email == email_antigo, Usuario.tipo == TIPO_COORDENADOR)
        .first()
    )

    update_data = coord_in.model_dump(exclude_unset=True)

    for campo, valor in update_data.items():
        if campo == "password":
            db_coord.hashed_password = get_password_hash(valor)
        else:
            setattr(db_coord, campo, valor)

    # Mantém o acesso de login em sincronia (nome, e-mail e senha). Se o vínculo
    # não existir (coordenador criado antes desta correção), cria agora.
    if usuario is None:
        usuario = Usuario(tipo=TIPO_COORDENADOR)
        db.add(usuario)
    usuario.nome = db_coord.nome
    usuario.email = db_coord.email
    usuario.senha = db_coord.hashed_password

    db.commit()
    db.refresh(db_coord)
    return db_coord


@router.delete("/{coordenador_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(verificar_admin)])
def deletar_coordenador(coordenador_id: int, db: Session = Depends(get_db)):
    """Remove o acesso do coordenador (Soft delete para auditoria)."""
    
    db_coord = db.query(Coordenador).filter(Coordenador.id == coordenador_id, Coordenador.ativo == True).first()
    if not db_coord:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coordenador não encontrado.")

    db_coord.ativo = False

    # Remove o acesso de login para que o coordenador desativado não consiga logar.
    usuario = (
        db.query(Usuario)
        .filter(Usuario.email == db_coord.email, Usuario.tipo == TIPO_COORDENADOR)
        .first()
    )
    if usuario:
        db.delete(usuario)

    db.commit()
    return None