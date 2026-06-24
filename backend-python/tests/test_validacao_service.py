import datetime

from app.models.alocacao import Alocacao
from app.models.curso import Curso
from app.models.disciplina import Disciplina
from app.models.horario import Horario
from app.models.oferta_disciplina import OfertaDisciplina
from app.models.professor import Professor
from app.models.semestre import Semestre
from app.models.turma import Turma
from app.services import validacao_service


def _criar_base(db):
    curso = Curso(nome="ADS", nivel="Tecnologo")
    db.add(curso)
    db.commit()

    semestre = Semestre(
        nome="2026.1",
        data_inicio=datetime.date(2026, 1, 1),
        data_fim=datetime.date(2026, 6, 30),
        status="ATIVO",
    )
    db.add(semestre)
    db.commit()

    turma = Turma(nome="ADS1", curso_id=curso.id, semestre_id=semestre.id, semestre_nivel=1)
    db.add(turma)
    db.commit()

    disciplina1 = Disciplina(nome="POO", curso_id=curso.id, carga_horaria=2)
    disciplina2 = Disciplina(nome="Banco de Dados", curso_id=curso.id, carga_horaria=2)
    db.add_all([disciplina1, disciplina2])
    db.commit()

    professor = Professor(
        nome="Joao", email="joao@x.com", regime_trabalho="DE", carga_maxima=2, afastado=True
    )
    db.add(professor)
    db.commit()

    horario = Horario(
        dia_semana="SEGUNDA", turno="MANHA", hora_inicio=datetime.time(7, 30), hora_fim=datetime.time(8, 20)
    )
    db.add(horario)
    db.commit()

    oferta1 = OfertaDisciplina(
        turma_id=turma.id, disciplina_id=disciplina1.id, professor_id=professor.id, carga_horaria=2
    )
    oferta2 = OfertaDisciplina(
        turma_id=turma.id, disciplina_id=disciplina2.id, professor_id=professor.id, carga_horaria=2
    )
    db.add_all([oferta1, oferta2])
    db.commit()

    return semestre, oferta1, oferta2, horario


def test_detecta_conflitos_e_sobrecarga(db):
    semestre, oferta1, oferta2, horario = _criar_base(db)

    db.add(Alocacao(oferta_id=oferta1.id, horario_id=horario.id))
    db.add(Alocacao(oferta_id=oferta2.id, horario_id=horario.id))
    db.commit()

    alertas = validacao_service.validar_semestre(semestre.id, db)
    tipos = {a["tipo"] for a in alertas}

    assert "CONFLITO_PROFESSOR" in tipos
    assert "CONFLITO_TURMA" in tipos
    assert "PROFESSOR_AFASTADO" in tipos
    assert "SOBRECARGA" in tipos


def test_disciplina_sem_horario(db):
    semestre, oferta1, oferta2, _horario = _criar_base(db)
    # Nenhuma alocação criada para as ofertas.

    alertas = validacao_service.validar_semestre(semestre.id, db)
    tipos_por_oferta = {
        a["entidade_id"] for a in alertas if a["tipo"] == "DISCIPLINA_SEM_HORARIO"
    }

    assert oferta1.id in tipos_por_oferta
    assert oferta2.id in tipos_por_oferta
