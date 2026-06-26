"""Seed de dados iniciais.

Cria os usuarios de demonstracao e popula o banco local com os dados necessarios
para o frontend funcionar apos subir o Docker.
"""

from app.core.database import SessionLocal
from app.core.security import get_password_hash

from app.models.usuario import Usuario
from app.models.professor import Professor
from app.models.coordenador import Coordenador

from app.core.seed_dados_teste import seed_dados_teste
from app.core.seed_cursos_reais import seed_cursos_reais
from app.core.seed_disciplinas_reais import importar_disciplinas_ads_redes, remover_curso_matematica
from app.core.seed_docentes_reais import seed_docentes_reais


USUARIOS_DEMO = [
    ("Administrador", "admin@ifce.edu.br", "admin", "ADMIN"),
    ("Saulo Anderson", "saulo.anderson@ifce.edu.br", "123456", "COORDENADOR"),
    ("Ana Silva", "ana.silva@ifce.edu.br", "prof123", "PROFESSOR"),
]

PROFESSOR_DEMO = {
    "nome": "Ana Silva",
    "email": "ana.silva@ifce.edu.br",
    "regime_trabalho": "DE",
    "area": "Computacao",
    "carga_maxima": 20,
}


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

        if not db.query(Professor).filter(Professor.email == PROFESSOR_DEMO["email"]).first():
            db.add(Professor(**PROFESSOR_DEMO))
            criados += 1

        for coord in db.query(Coordenador).filter(Coordenador.ativo == True).all():
            if not db.query(Usuario).filter(Usuario.email == coord.email).first():
                db.add(
                    Usuario(
                        nome=coord.nome,
                        email=coord.email,
                        senha=coord.hashed_password,
                        tipo="COORDENADOR",
                    )
                )
                criados += 1

        if criados:
            db.commit()

    finally:
        db.close()

    # Popula o banco automaticamente.
    # Ordem importante:
    # 1. cria ADS/Redes, semestres, turmas, horarios e ofertas base;
    # 2. cria cursos reais do campus;
    # 3. substitui disciplinas ADS/Redes pelas matrizes reais;
    # 4. remove Matematica;
    # 5. cria docentes reais, logins e coordenadores.
    seed_dados_teste()
    seed_cursos_reais()
    importar_disciplinas_ads_redes()
    remover_curso_matematica()
    seed_docentes_reais()
