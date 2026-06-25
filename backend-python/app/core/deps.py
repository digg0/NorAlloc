"""Dependências de autenticação/autorização compartilhadas entre routers.

Centraliza a leitura do usuário logado (JWT Bearer) e a resolução do
curso do coordenador, para que cada módulo (turmas, disciplinas, ofertas)
possa restringir o que o coordenador vê/gerencia ao seu próprio curso.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decodificar_token
from app.models.coordenador import Coordenador
from app.models.usuario import Usuario

_bearer = HTTPBearer(auto_error=True)


def obter_usuario_atual(
    credenciais: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
) -> Usuario:
    """Valida o token Bearer e retorna o usuário logado (ADMIN/COORDENADOR/PROFESSOR)."""
    payload = decodificar_token(credenciais.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
        )
    usuario = db.query(Usuario).filter(Usuario.id == int(payload["sub"])).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado.",
        )
    return usuario


def obter_curso_id_coordenador(usuario: Usuario, db: Session) -> int | None:
    """Retorna o curso_id do coordenador autenticado.

    Retorna None se o usuário não for um coordenador (ou se o vínculo de
    coordenador estiver inativo) — nesse caso o chamador não deve filtrar
    por curso (ex.: ADMIN vê tudo).
    """
    if usuario.tipo != "COORDENADOR":
        return None
    coordenador = (
        db.query(Coordenador)
        .filter(Coordenador.usuario_id == usuario.id, Coordenador.ativo == True)
        .first()
    )
    return coordenador.curso_id if coordenador else None
