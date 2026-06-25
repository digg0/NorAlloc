import datetime

from app.models.alocacao import Alocacao
from app.models.curso import Curso
from app.models.disciplina import Disciplina
from app.models.horario import Horario
from app.models.oferta_disciplina import OfertaDisciplina
from app.models.professor import Professor
from app.models.semestre import Semestre
from app.models.turma import Turma
from app.services import solver_service


def _criar_base(db, prof1_afastado=False):
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

    turma = Turma(nome="ADS2", curso_id=curso.id, semestre_id=semestre.id, semestre_nivel=2)
    db.add(turma)
    db.commit()

    disciplina1 = Disciplina(nome="POO", curso_id=curso.id, carga_horaria=4)
    disciplina2 = Disciplina(nome="Banco de Dados", curso_id=curso.id, carga_horaria=4)
    db.add_all([disciplina1, disciplina2])
    db.commit()

    prof1 = Professor(
        nome="Joao", email="joao@x.com", regime_trabalho="DE", carga_maxima=20, afastado=prof1_afastado
    )
    prof2 = Professor(nome="Maria", email="maria@x.com", regime_trabalho="DE", carga_maxima=20)
    db.add_all([prof1, prof2])
    db.commit()

    horarios = []
    for dia in ["SEGUNDA", "TERCA", "QUARTA"]:
        for hi, hf in [
            (datetime.time(7, 30), datetime.time(8, 20)),
            (datetime.time(8, 20), datetime.time(9, 10)),
        ]:
            h = Horario(dia_semana=dia, turno="MANHA", hora_inicio=hi, hora_fim=hf)
            db.add(h)
            horarios.append(h)
    db.commit()

    oferta1 = OfertaDisciplina(
        turma_id=turma.id, disciplina_id=disciplina1.id, professor_id=prof1.id, carga_horaria=4
    )
    oferta2 = OfertaDisciplina(
        turma_id=turma.id, disciplina_id=disciplina2.id, professor_id=prof2.id, carga_horaria=2
    )
    db.add_all([oferta1, oferta2])
    db.commit()

    return semestre, oferta1, oferta2


def test_gera_grade_sem_conflitos(db):
    semestre, oferta1, oferta2 = _criar_base(db)

    resultado = solver_service.gerar_grade(semestre.id, db)

    assert resultado.sucesso is True
    assert resultado.total_alocacoes == 6

    alocacoes = db.query(Alocacao).all()
    assert len(alocacoes) == 6

    # Nenhum horário repetido para a mesma oferta.
    pares = [(a.oferta_id, a.horario_id) for a in alocacoes]
    assert len(pares) == len(set(pares))

    # Cada oferta recebeu exatamente sua carga horária semanal.
    por_oferta = {}
    for a in alocacoes:
        por_oferta[a.oferta_id] = por_oferta.get(a.oferta_id, 0) + 1
    assert por_oferta[oferta1.id] == 4
    assert por_oferta[oferta2.id] == 2


def test_professor_afastado_e_excluido_do_solver(db):
    semestre, oferta1, _oferta2 = _criar_base(db, prof1_afastado=True)

    resultado = solver_service.gerar_grade(semestre.id, db)

    # oferta1 não tem horários elegíveis (professor afastado) e precisa de 4
    # slots: o solver deve recusar a geração em vez de quebrar a regra.
    assert resultado.sucesso is False
    assert resultado.total_alocacoes == 0
