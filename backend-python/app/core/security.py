import base64
import bcrypt
import hashlib
import hmac
import json
import os
import time

def _pre_hash(password: str) -> bytes:
    """
    Aplica SHA-256 na senha antes do bcrypt.
    Isso padroniza qualquer tamanho de senha em 32 bytes (64 hex chars),
    evitando o erro do limite de 72 bytes do bcrypt e ataques de DoS.
    """
    return hashlib.sha256(password.encode('utf-8')).hexdigest().encode('utf-8')

def get_password_hash(password: str) -> str:
    """Gera o hash usando bcrypt após o pré-hash."""
    pre_hashed = _pre_hash(password)

    hashed = bcrypt.hashpw(pre_hashed, bcrypt.gensalt())
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha plana corresponde ao hash armazenado."""
    pre_hashed = _pre_hash(plain_password)

    return bcrypt.checkpw(pre_hashed, hashed_password.encode('utf-8'))


def senha_confere(senha_plana: str, senha_armazenada: str) -> bool:
    """Confere a senha aceitando tanto hash bcrypt quanto texto puro (legado).

    Usuários criados antes do hash ficaram em texto puro; usuários novos e o
    seed usam bcrypt. Um hash bcrypt sempre começa com "$2".
    """
    if senha_armazenada and senha_armazenada.startswith("$2"):
        try:
            return verify_password(senha_plana, senha_armazenada)
        except Exception:
            return False
    return senha_plana == senha_armazenada


# ---------------------------------------------------------------------------
# JWT HS256 mínimo usando apenas a stdlib (sem dependência de pyjwt).
# ---------------------------------------------------------------------------
SECRET_KEY = os.getenv("SECRET_KEY", "noralloc-dev-secret-trocar-em-producao")
ALGORITMO = "HS256"
EXPIRACAO_HORAS = int(os.getenv("TOKEN_EXPIRACAO_HORAS", "8"))


def _b64url(dados: bytes) -> str:
    return base64.urlsafe_b64encode(dados).rstrip(b"=").decode("ascii")


def _b64url_decode(texto: str) -> bytes:
    padding = "=" * (-len(texto) % 4)
    return base64.urlsafe_b64decode(texto + padding)


def criar_token_acesso(dados: dict, expira_em_horas: int | None = None) -> str:
    """Gera um JWT assinado (HS256) com expiração."""
    horas = EXPIRACAO_HORAS if expira_em_horas is None else expira_em_horas
    header = {"alg": ALGORITMO, "typ": "JWT"}
    corpo = dict(dados)
    corpo["exp"] = int(time.time()) + horas * 3600
    h = _b64url(json.dumps(header, separators=(",", ":")).encode())
    p = _b64url(json.dumps(corpo, separators=(",", ":")).encode())
    assinatura = hmac.new(
        SECRET_KEY.encode(), f"{h}.{p}".encode(), hashlib.sha256
    ).digest()
    return f"{h}.{p}.{_b64url(assinatura)}"


def decodificar_token(token: str) -> dict | None:
    """Valida assinatura e expiração; retorna o payload ou None se inválido."""
    try:
        h, p, s = token.split(".")
        esperada = hmac.new(
            SECRET_KEY.encode(), f"{h}.{p}".encode(), hashlib.sha256
        ).digest()
        if not hmac.compare_digest(_b64url_decode(s), esperada):
            return None
        corpo = json.loads(_b64url_decode(p))
        if corpo.get("exp", 0) < int(time.time()):
            return None
        return corpo
    except Exception:
        return None