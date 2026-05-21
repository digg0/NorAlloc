import bcrypt
import hashlib

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