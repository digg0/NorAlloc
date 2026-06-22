"""Seed de dados iniciais.

Cria os 3 usuários de demonstração (admin, coordenador e professor) caso ainda
não existam, usando as MESMAS credenciais do mock do frontend para facilitar o
teste da integração de login. As senhas são gravadas já com hash bcrypt.
"""
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.usuario import Usuario

# (nome, email, senha, tipo)
USUARIOS_DEMO = [
    ("Administrador", "admin@ifce.edu.br", "admin", "ADMIN"),
    ("Saulo Anderson", "saulo.anderson@ifce.edu.br", "123456", "COORDENADOR"),
    ("Ana Silva", "ana.silva@ifce.edu.br", "prof123", "PROFESSOR"),
]


def seed_usuarios_demo() -> None:
    db = SessionLocal()
    try:
        criados = 0
        for nome, email, senha, tipo in USUARIOS_DEMO:
            existe = db.query(Usuario).filter(Usuario.email == email).first()
            if existe:
                continue
            db.add(
                Usuario(
                    nome=nome,
                    email=email,
                    senha=get_password_hash(senha),
                    tipo=tipo,
                )
            )
            criados += 1
        if criados:
            db.commit()
    finally:
        db.close()
