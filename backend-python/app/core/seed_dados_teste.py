"""Seed de dados reais para teste manual (cursos, semestres, turmas,
disciplinas, horários e ofertas).

Os professores e coordenadores ficaram a cargo de `seed_docentes_reais.py`
(docentes de fato da instituição). As ofertas aqui ficam sem professor
(professor_id nulo); `seed_docentes_reais.py` atribui um docente real a
qualquer oferta nessa condição.

Idempotente: pode ser executado várias vezes sem duplicar registros (busca
por chave natural antes de inserir). Não é chamado automaticamente no boot
da aplicação — execute manualmente quando quiser popular o banco local:

    python -m app.core.seed_dados_teste
"""
import datetime

from app.core.database import SessionLocal
from app.models.curso import Curso
from app.models.disciplina import Disciplina
from app.models.horario import Horario
from app.models.oferta_disciplina import OfertaDisciplina
from app.models.semestre import Semestre
from app.models.turma import Turma

CURSOS = [
    ("ADS", "Tecnólogo"),
    ("REDES DE COMPUTADORES", "Tecnólogo"),
    ("LICENCIATURA EM MATEMATICA", "Licenciatura"),
]

# (nome, data_inicio, data_fim, status)
SEMESTRES = [
    ("2026.1", datetime.date(2026, 2, 2), datetime.date(2026, 6, 30), "ATIVO"),
    ("2026.2", datetime.date(2026, 8, 3), datetime.date(2026, 12, 18), "PLANEJAMENTO"),
    ("2027.1", datetime.date(2027, 2, 1), datetime.date(2027, 6, 30), "PLANEJAMENTO"),
]

# (nome, curso_nome, semestre_nome, semestre_nivel)
TURMAS = [
    ("ADS1", "ADS", "2026.1", 1),
    ("ADS2", "ADS", "2026.1", 2),
    ("REDES1", "REDES DE COMPUTADORES", "2026.1", 1),
]

# (nome, curso_nome, carga_horaria)
DISCIPLINAS = [
    ("Programação Orientada a Objetos", "ADS", 4),
    ("Banco de Dados", "ADS", 4),
    ("Redes de Computadores", "REDES DE COMPUTADORES", 4),
]

# Grade-padrão (IFCE Campus Tauá): 4 aulas de manhã, 4 de tarde, 5 de noite.
# (turno, hora_inicio, hora_fim) — apenas slots de AULA (intervalo/almoço não
# são Horario, são só os espaços em branco entre eles).
SLOTS_PADRAO = [
    ("MANHA", datetime.time(7, 25), datetime.time(8, 25)),
    ("MANHA", datetime.time(8, 25), datetime.time(9, 25)),
    # intervalo 09:25–09:50
    ("MANHA", datetime.time(9, 50), datetime.time(10, 50)),
    ("MANHA", datetime.time(10, 50), datetime.time(11, 50)),
    # almoço 11:50–13:00
    ("TARDE", datetime.time(13, 0), datetime.time(14, 0)),
    ("TARDE", datetime.time(14, 0), datetime.time(15, 0)),
    # intervalo 15:00–15:25
    ("TARDE", datetime.time(15, 25), datetime.time(16, 25)),
    ("TARDE", datetime.time(16, 25), datetime.time(17, 25)),
    # janta 17:25–18:20
    ("NOITE", datetime.time(18, 20), datetime.time(19, 10)),
    ("NOITE", datetime.time(19, 10), datetime.time(20, 0)),
    # intervalo 20:00–20:10
    ("NOITE", datetime.time(20, 10), datetime.time(21, 0)),
    ("NOITE", datetime.time(21, 0), datetime.time(21, 50)),
    ("NOITE", datetime.time(21, 50), datetime.time(22, 40)),
]

DIAS_UTEIS = ["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA"]

# (dia_semana, turno, hora_inicio, hora_fim) — grade completa: 5 dias x 13 slots.
HORARIOS = [
    (dia, turno, hora_inicio, hora_fim)
    for dia in DIAS_UTEIS
    for turno, hora_inicio, hora_fim in SLOTS_PADRAO
]

# (turma_nome, disciplina_nome, carga_horaria) — sem professor: atribuído
# por seed_docentes_reais.py.
OFERTAS = [
    ("ADS1", "Programação Orientada a Objetos", 4),
    ("ADS2", "Banco de Dados", 4),
    ("REDES1", "Redes de Computadores", 4),
]


def seed_dados_teste() -> None:
    db = SessionLocal()
    try:
        cursos_por_nome = {}
        for nome, nivel in CURSOS:
            curso = db.query(Curso).filter(Curso.nome == nome).first()
            if not curso:
                curso = Curso(nome=nome, nivel=nivel, ativo=True)
                db.add(curso)
                db.flush()
            cursos_por_nome[nome] = curso

        semestres_por_nome = {}
        for nome, data_inicio, data_fim, status_ in SEMESTRES:
            semestre = db.query(Semestre).filter(Semestre.nome == nome).first()
            if not semestre:
                semestre = Semestre(nome=nome, data_inicio=data_inicio, data_fim=data_fim, status=status_)
                db.add(semestre)
                db.flush()
            semestres_por_nome[nome] = semestre

        turmas_por_nome = {}
        for nome, curso_nome, semestre_nome, nivel in TURMAS:
            turma = db.query(Turma).filter(Turma.nome == nome).first()
            if not turma:
                turma = Turma(
                    nome=nome,
                    curso_id=cursos_por_nome[curso_nome].id,
                    semestre_id=semestres_por_nome[semestre_nome].id,
                    semestre_nivel=nivel,
                )
                db.add(turma)
                db.flush()
            turmas_por_nome[nome] = turma

        disciplinas_por_nome = {}
        for nome, curso_nome, carga in DISCIPLINAS:
            disciplina = db.query(Disciplina).filter(Disciplina.nome == nome).first()
            if not disciplina:
                disciplina = Disciplina(nome=nome, curso_id=cursos_por_nome[curso_nome].id, carga_horaria=carga)
                db.add(disciplina)
                db.flush()
            disciplinas_por_nome[nome] = disciplina

        for dia, turno, hora_inicio, hora_fim in HORARIOS:
            existe = (
                db.query(Horario)
                .filter(
                    Horario.dia_semana == dia,
                    Horario.turno == turno,
                    Horario.hora_inicio == hora_inicio,
                    Horario.hora_fim == hora_fim,
                )
                .first()
            )
            if not existe:
                db.add(Horario(dia_semana=dia, turno=turno, hora_inicio=hora_inicio, hora_fim=hora_fim))

        for turma_nome, disciplina_nome, carga in OFERTAS:
            turma = turmas_por_nome[turma_nome]
            disciplina = disciplinas_por_nome[disciplina_nome]
            existe = (
                db.query(OfertaDisciplina)
                .filter(
                    OfertaDisciplina.turma_id == turma.id,
                    OfertaDisciplina.disciplina_id == disciplina.id,
                )
                .first()
            )
            if not existe:
                db.add(
                    OfertaDisciplina(
                        turma_id=turma.id,
                        disciplina_id=disciplina.id,
                        professor_id=None,
                        carga_horaria=carga,
                    )
                )

        db.commit()
        print("Dados de teste inseridos/confirmados com sucesso.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_dados_teste()
