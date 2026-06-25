"""Seed de dados iniciais.

Cria os 3 usuários de demonstração (admin, coordenador e professor) caso ainda
não existam, usando as MESMAS credenciais do mock do frontend para facilitar o
teste da integração de login. As senhas são gravadas já com hash bcrypt.
"""
from datetime import time as dt_time

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.usuario import Usuario
from app.models.professor import Professor
from app.models.coordenador import Coordenador
from app.models.horario import Horario

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

        # Cursos/disciplinas reais agora vêm de seed_cursos_reais.py +
        # seed_disciplinas_reais.py (rodados manualmente uma vez por banco).
        # NÃO chamar seed_curriculos() aqui: ele casa curso por nome exato e
        # os JSONs em app/data/grades_curriculares usam nomes diferentes dos
        # importados por esses scripts (ex.: "ADS" vs "Análise e
        # Desenvolvimento de Sistemas"), duplicando o curso a cada boot.

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

        # Horários padrão IFCE: M1-M5 (manhã), T1-T5 (tarde), N1-N4 (noite).
        if db.query(Horario).count() == 0:
            slots = [
                ("MANHA", dt_time(7, 0), dt_time(7, 50)),
                ("MANHA", dt_time(7, 50), dt_time(8, 40)),
                ("MANHA", dt_time(9, 0), dt_time(9, 50)),
                ("MANHA", dt_time(9, 50), dt_time(10, 40)),
                ("MANHA", dt_time(10, 40), dt_time(11, 30)),
                ("TARDE", dt_time(13, 0), dt_time(13, 50)),
                ("TARDE", dt_time(13, 50), dt_time(14, 40)),
                ("TARDE", dt_time(15, 0), dt_time(15, 50)),
                ("TARDE", dt_time(15, 50), dt_time(16, 40)),
                ("TARDE", dt_time(16, 40), dt_time(17, 30)),
                ("NOITE", dt_time(18, 30), dt_time(19, 20)),
                ("NOITE", dt_time(19, 20), dt_time(20, 10)),
                ("NOITE", dt_time(20, 20), dt_time(21, 10)),
                ("NOITE", dt_time(21, 10), dt_time(22, 0)),
            ]
            for turno, inicio, fim in slots:
                db.add(Horario(turno=turno, hora_inicio=inicio, hora_fim=fim))
            criados += len(slots)

        if criados:
            db.commit()
    finally:
        db.close()
