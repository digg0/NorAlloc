"""Seed de dados iniciais.

Cria os 3 usuários de demonstração (admin, coordenador e professor) caso ainda
não existam, usando as MESMAS credenciais do mock do frontend para facilitar o
teste da integração de login. As senhas são gravadas já com hash bcrypt.
"""
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.core.curriculos import seed_curriculos
from app.models.usuario import Usuario
from app.models.professor import Professor
from app.models.coordenador import Coordenador

# (nome, email, senha, tipo)
USUARIOS_DEMO = [
    ("Administrador", "admin@ifce.edu.br", "admin", "ADMIN"),
    ("Saulo Anderson", "saulo.anderson@ifce.edu.br", "123456", "COORDENADOR"),
    ("Ana Silva", "ana.silva@ifce.edu.br", "prof123", "PROFESSOR"),
]

# Os cursos e disciplinas agora vêm das grades curriculares versionadas em
# app/data/grades_curriculares/*.json (ver seed_curriculos).

# Cadastro de docente para o usuário demo do tipo PROFESSOR, para que o
# dashboard dele já tenha dados reais (regime, carga máxima, etc.).
PROFESSOR_DEMO = {
    "nome": "Ana Silva",
    "email": "ana.silva@ifce.edu.br",
    "regime_trabalho": "DE",
    "area": "Computação",
    "carga_maxima": 20,
}


def seed_usuarios_demo() -> None:
    db = SessionLocal()
    try:
        criados = 0

        # Cursos + disciplinas a partir dos currículos versionados (JSON).
        # Necessário para os cadastros de disciplinas/turmas (FK em cursos).
        criados += seed_curriculos(db)

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

        if not db.query(Professor).filter(Professor.email == PROFESSOR_DEMO["email"]).first():
            db.add(Professor(**PROFESSOR_DEMO))
            criados += 1

        # Backfill: coordenadores criados antes do vínculo com `usuarios` não
        # conseguiam logar (401). Garante um acesso de login para cada um.
        for coord in db.query(Coordenador).filter(Coordenador.ativo == True).all():
            if not db.query(Usuario).filter(Usuario.email == coord.email).first():
                db.add(Usuario(
                    nome=coord.nome,
                    email=coord.email,
                    senha=coord.hashed_password,
                    tipo="COORDENADOR",
                ))
                criados += 1

        if criados:
            db.commit()
    finally:
        db.close()
