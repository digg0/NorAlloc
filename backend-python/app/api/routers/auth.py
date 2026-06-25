from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import senha_confere, criar_token_acesso, decodificar_token
from app.models.usuario import Usuario
from app.schemas.auth import LoginRequest, TokenResponse, UsuarioAutenticado

router = APIRouter(prefix="/api/auth", tags=["Autenticação"])

_bearer = HTTPBearer(auto_error=True)


@router.post("/login", response_model=TokenResponse)
def login(dados: LoginRequest, db: Session = Depends(get_db)):
    """Autentica um usuário (admin, coordenador ou professor) pelo e-mail/senha.

    Retorna um token JWT e os dados do usuário (id, nome, e-mail e tipo).
    O `tipo` define o papel no frontend: ADMIN, COORDENADOR ou PROFESSOR.
    """
    usuario = db.query(Usuario).filter(Usuario.email == dados.email).first()
    if not usuario or not senha_confere(dados.senha, usuario.senha):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos.",
        )

    token = criar_token_acesso(
        {"sub": str(usuario.id), "email": usuario.email, "tipo": usuario.tipo}
    )
    return TokenResponse(
        acesso_token=token,
        usuario=UsuarioAutenticado.model_validate(usuario),
    )


def obter_usuario_atual(
    credenciais: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
) -> Usuario:
    """Dependência que valida o token Bearer e retorna o usuário logado."""
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


@router.get("/me", response_model=UsuarioAutenticado)
def usuario_logado(usuario: Usuario = Depends(obter_usuario_atual)):
    """Retorna os dados do usuário autenticado pelo token."""
    return usuario


def verificar_admin(usuario: Usuario = Depends(obter_usuario_atual)) -> Usuario:
    if usuario.tipo != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores.",
        )
    return usuario


def verificar_admin_ou_coordenador(usuario: Usuario = Depends(obter_usuario_atual)) -> Usuario:
    if usuario.tipo not in ("ADMIN", "COORDENADOR"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores e coordenadores.",
        )
    return usuario
