from pydantic import BaseModel, EmailStr, ConfigDict


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str


class UsuarioAutenticado(BaseModel):
    """Dados do usuário retornados após o login (sem a senha)."""
    id: int
    nome: str
    email: EmailStr
    tipo: str

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    acesso_token: str
    token_tipo: str = "bearer"
    usuario: UsuarioAutenticado
