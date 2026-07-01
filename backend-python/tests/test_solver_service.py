import datetime
from collections import defaultdict

from app.models.alocacao import Alocacao
from app.models.curso import Curso
from app.models.disciplina import Disciplina
from app.models.horario import Horario
from app.models.oferta_disciplina import OfertaDisciplina
from app.models.preferencias_professor import PreferenciaProfessor
from app.models.professor import Professor
from app.models.semestre import Semestre
from app.models.turma import Turma
from app.services import solver_service


# ── helpers ────────────────────────────────────────────────────────────────────

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


def _verificar_constraints_hard(db):
    """Garante que professor e turma nunca têm dois compromissos no mesmo horário."""
    alocacoes = db.query(Alocacao).all()
    ofertas = {o.id: o for o in db.query(OfertaDisciplina).all()}

    por_professor: dict = defaultdict(list)
    por_turma: dict = defaultdict(list)

    for a in alocacoes:
        oferta = ofertas[a.oferta_id]
        if oferta.professor_id:
            por_professor[oferta.professor_id].append(a.horario_id)
        por_turma[oferta.turma_id].append(a.horario_id)

    for prof_id, horario_ids in por_professor.items():
        assert len(horario_ids) == len(set(horario_ids)), \
            f"Professor {prof_id} alocado em dois lugares no mesmo horário"

    for turma_id, horario_ids in por_turma.items():
        assert len(horario_ids) == len(set(horario_ids)), \
            f"Turma {turma_id} com duas disciplinas no mesmo horário"


# ── testes originais ────────────────────────────────────────────────────────────

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

    _verificar_constraints_hard(db)


def test_professor_afastado_e_excluido_do_solver(db):
    semestre, oferta1, _oferta2 = _criar_base(db, prof1_afastado=True)

    resultado = solver_service.gerar_grade(semestre.id, db)

    # oferta1 não tem horários elegíveis (professor afastado) e precisa de 4
    # slots: o solver deve recusar a geração em vez de quebrar a regra.
    assert resultado.sucesso is False
    assert resultado.total_alocacoes == 0


# ── hard constraints ────────────────────────────────────────────────────────────

def test_professor_nunca_em_dois_horarios_simultaneos(db):
    """Mesmo professor em 2 turmas: horários alocados nunca se sobrepõem."""
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

    turma1 = Turma(nome="ADS1", curso_id=curso.id, semestre_id=semestre.id, semestre_nivel=1)
    turma2 = Turma(nome="ADS2", curso_id=curso.id, semestre_id=semestre.id, semestre_nivel=2)
    db.add_all([turma1, turma2])
    db.commit()

    disc = Disciplina(nome="POO", curso_id=curso.id, carga_horaria=2)
    db.add(disc)
    db.commit()

    # Um único professor nas duas turmas — força o solver a evitar sobreposição.
    prof = Professor(nome="Joao", email="joao@x.com", regime_trabalho="DE", carga_maxima=20)
    db.add(prof)
    db.commit()

    for dia in ["SEGUNDA", "TERCA", "QUARTA"]:
        for hi, hf in [
            (datetime.time(7, 30), datetime.time(8, 20)),
            (datetime.time(8, 20), datetime.time(9, 10)),
        ]:
            db.add(Horario(dia_semana=dia, turno="MANHA", hora_inicio=hi, hora_fim=hf))
    db.commit()

    oferta1 = OfertaDisciplina(turma_id=turma1.id, disciplina_id=disc.id, professor_id=prof.id, carga_horaria=2)
    oferta2 = OfertaDisciplina(turma_id=turma2.id, disciplina_id=disc.id, professor_id=prof.id, carga_horaria=2)
    db.add_all([oferta1, oferta2])
    db.commit()

    resultado = solver_service.gerar_grade(semestre.id, db)
    assert resultado.sucesso is True
    assert resultado.total_alocacoes == 4

    _verificar_constraints_hard(db)


def test_turma_nunca_tem_duas_disciplinas_no_mesmo_horario(db):
    """2 disciplinas na mesma turma nunca ocupam o mesmo slot."""
    semestre, oferta1, oferta2 = _criar_base(db)

    resultado = solver_service.gerar_grade(semestre.id, db)
    assert resultado.sucesso is True

    _verificar_constraints_hard(db)


def test_carga_maxima_estourada_recusa_geracao(db):
    """Solver recusa quando a oferta excede a carga máxima semanal do professor."""
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

    disc = Disciplina(nome="POO", curso_id=curso.id, carga_horaria=4)
    db.add(disc)
    db.commit()

    # carga_maxima=2h → max_creditos_semanais(2) = int(2×60/50) = 2 créditos.
    # Oferta pede 4 → deve ser recusado antes do Z3.
    prof = Professor(nome="Joao", email="joao@x.com", regime_trabalho="DE", carga_maxima=2)
    db.add(prof)
    db.commit()

    for dia in ["SEGUNDA", "TERCA"]:
        for hi, hf in [
            (datetime.time(7, 30), datetime.time(8, 20)),
            (datetime.time(8, 20), datetime.time(9, 10)),
            (datetime.time(9, 45), datetime.time(10, 35)),
        ]:
            db.add(Horario(dia_semana=dia, turno="MANHA", hora_inicio=hi, hora_fim=hf))
    db.commit()

    oferta = OfertaDisciplina(turma_id=turma.id, disciplina_id=disc.id, professor_id=prof.id, carga_horaria=4)
    db.add(oferta)
    db.commit()

    resultado = solver_service.gerar_grade(semestre.id, db)
    assert resultado.sucesso is False
    assert resultado.total_alocacoes == 0


def test_horarios_insuficientes_retorna_falha(db):
    """Menos horários disponíveis do que a carga da oferta: solver recusa."""
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

    disc = Disciplina(nome="POO", curso_id=curso.id, carga_horaria=4)
    db.add(disc)
    db.commit()

    prof = Professor(nome="Joao", email="joao@x.com", regime_trabalho="DE", carga_maxima=20)
    db.add(prof)
    db.commit()

    # Apenas 2 horários disponíveis; oferta exige 4.
    db.add(Horario(dia_semana="SEGUNDA", turno="MANHA", hora_inicio=datetime.time(7, 30), hora_fim=datetime.time(8, 20)))
    db.add(Horario(dia_semana="SEGUNDA", turno="MANHA", hora_inicio=datetime.time(8, 20), hora_fim=datetime.time(9, 10)))
    db.commit()

    oferta = OfertaDisciplina(turma_id=turma.id, disciplina_id=disc.id, professor_id=prof.id, carga_horaria=4)
    db.add(oferta)
    db.commit()

    resultado = solver_service.gerar_grade(semestre.id, db)
    assert resultado.sucesso is False
    assert resultado.total_alocacoes == 0


# ── soft constraints / preferências ────────────────────────────────────────────

def test_max_aulas_dia_e_respeitado(db):
    """PreferenciaProfessor.max_aulas_dia=2 nunca é ultrapassado por dia."""
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

    disc = Disciplina(nome="POO", curso_id=curso.id, carga_horaria=4)
    db.add(disc)
    db.commit()

    prof = Professor(nome="Joao", email="joao@x.com", regime_trabalho="DE", carga_maxima=20)
    db.add(prof)
    db.commit()

    # 3 slots por dia em 3 dias (9 disponíveis). Com max_aulas_dia=2, o solver
    # é obrigado a usar pelo menos 2 dias para alocar 4 créditos.
    for dia in ["SEGUNDA", "TERCA", "QUARTA"]:
        for hi, hf in [
            (datetime.time(7, 30), datetime.time(8, 20)),
            (datetime.time(8, 20), datetime.time(9, 10)),
            (datetime.time(9, 45), datetime.time(10, 35)),
        ]:
            db.add(Horario(dia_semana=dia, turno="MANHA", hora_inicio=hi, hora_fim=hf))
    db.commit()

    db.add(PreferenciaProfessor(professor_id=prof.id, max_aulas_dia=2))
    db.commit()

    oferta = OfertaDisciplina(turma_id=turma.id, disciplina_id=disc.id, professor_id=prof.id, carga_horaria=4)
    db.add(oferta)
    db.commit()

    resultado = solver_service.gerar_grade(semestre.id, db)
    assert resultado.sucesso is True

    alocacoes = db.query(Alocacao).filter(Alocacao.oferta_id == oferta.id).all()
    horario_ids = [a.horario_id for a in alocacoes]
    horarios_obj = db.query(Horario).filter(Horario.id.in_(horario_ids)).all()

    aulas_por_dia: dict = defaultdict(int)
    for h in horarios_obj:
        aulas_por_dia[h.dia_semana] += 1

    assert all(qtd <= 2 for qtd in aulas_por_dia.values()), \
        f"max_aulas_dia=2 violado: {dict(aulas_por_dia)}"


def test_distribuicao_por_dias_evita_concentracao(db):
    """Com 4 créditos, a grade não deve concentrar os 4 slots num único dia."""
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

    disc = Disciplina(nome="POO", curso_id=curso.id, carga_horaria=4)
    db.add(disc)
    db.commit()

    prof = Professor(nome="Joao", email="joao@x.com", regime_trabalho="DE", carga_maxima=20)
    db.add(prof)
    db.commit()

    # 4 slots por dia em 3 dias — sem a restrição de distribuição, tudo iria
    # para SEGUNDA. Com ela, no máximo 2 por dia.
    for dia in ["SEGUNDA", "TERCA", "QUARTA"]:
        for hi, hf in [
            (datetime.time(7, 30), datetime.time(8, 20)),
            (datetime.time(8, 20), datetime.time(9, 10)),
            (datetime.time(9, 45), datetime.time(10, 35)),
            (datetime.time(10, 35), datetime.time(11, 25)),
        ]:
            db.add(Horario(dia_semana=dia, turno="MANHA", hora_inicio=hi, hora_fim=hf))
    db.commit()

    oferta = OfertaDisciplina(turma_id=turma.id, disciplina_id=disc.id, professor_id=prof.id, carga_horaria=4)
    db.add(oferta)
    db.commit()

    resultado = solver_service.gerar_grade(semestre.id, db)
    assert resultado.sucesso is True

    alocacoes = db.query(Alocacao).filter(Alocacao.oferta_id == oferta.id).all()
    horario_ids = [a.horario_id for a in alocacoes]
    horarios_obj = db.query(Horario).filter(Horario.id.in_(horario_ids)).all()

    aulas_por_dia: dict = defaultdict(int)
    for h in horarios_obj:
        aulas_por_dia[h.dia_semana] += 1

    assert all(qtd <= 2 for qtd in aulas_por_dia.values()), \
        f"Mais de 2 slots num único dia: {dict(aulas_por_dia)}"
    assert len(aulas_por_dia) >= 2, "Todos os slots concentrados num único dia"


def test_evitar_sexta_nao_aloca_na_sexta(db):
    """Com evitar_sexta=True e slots em outros dias suficientes, sexta é evitada."""
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

    disc = Disciplina(nome="POO", curso_id=curso.id, carga_horaria=2)
    db.add(disc)
    db.commit()

    prof = Professor(nome="Joao", email="joao@x.com", regime_trabalho="DE", carga_maxima=20)
    db.add(prof)
    db.commit()

    # 2 slots na segunda e 2 slots na sexta. Com evitar_sexta, o solver
    # deve escolher os 2 de segunda.
    for hi, hf in [
        (datetime.time(7, 30), datetime.time(8, 20)),
        (datetime.time(8, 20), datetime.time(9, 10)),
    ]:
        db.add(Horario(dia_semana="SEGUNDA", turno="MANHA", hora_inicio=hi, hora_fim=hf))
        db.add(Horario(dia_semana="SEXTA", turno="MANHA", hora_inicio=hi, hora_fim=hf))
    db.commit()

    db.add(PreferenciaProfessor(professor_id=prof.id, evitar_sexta=True))
    db.commit()

    oferta = OfertaDisciplina(turma_id=turma.id, disciplina_id=disc.id, professor_id=prof.id, carga_horaria=2)
    db.add(oferta)
    db.commit()

    resultado = solver_service.gerar_grade(semestre.id, db)
    assert resultado.sucesso is True

    alocacoes = db.query(Alocacao).filter(Alocacao.oferta_id == oferta.id).all()
    horario_ids = [a.horario_id for a in alocacoes]
    horarios_obj = {h.id: h for h in db.query(Horario).filter(Horario.id.in_(horario_ids)).all()}

    for a in alocacoes:
        assert horarios_obj[a.horario_id].dia_semana != "SEXTA", \
            "Slot de sexta alocado com evitar_sexta=True"


def test_prefere_manha_favorece_slots_de_manha(db):
    """Com prefere_manha=True e manhã suficiente, todos os slots alocados são MANHA."""
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

    disc = Disciplina(nome="POO", curso_id=curso.id, carga_horaria=2)
    db.add(disc)
    db.commit()

    prof = Professor(nome="Joao", email="joao@x.com", regime_trabalho="DE", carga_maxima=20)
    db.add(prof)
    db.commit()

    # 2 slots de manhã e 2 de tarde por dia (2 dias = 4 manhã + 4 tarde).
    # Disciplina precisa de 2. Com prefere_manha, o solver deve escolher manhã.
    for dia in ["SEGUNDA", "TERCA"]:
        db.add(Horario(dia_semana=dia, turno="MANHA", hora_inicio=datetime.time(7, 30), hora_fim=datetime.time(8, 20)))
        db.add(Horario(dia_semana=dia, turno="MANHA", hora_inicio=datetime.time(8, 20), hora_fim=datetime.time(9, 10)))
        db.add(Horario(dia_semana=dia, turno="TARDE", hora_inicio=datetime.time(13, 0), hora_fim=datetime.time(14, 0)))
        db.add(Horario(dia_semana=dia, turno="TARDE", hora_inicio=datetime.time(14, 0), hora_fim=datetime.time(15, 0)))
    db.commit()

    db.add(PreferenciaProfessor(professor_id=prof.id, prefere_manha=True))
    db.commit()

    oferta = OfertaDisciplina(turma_id=turma.id, disciplina_id=disc.id, professor_id=prof.id, carga_horaria=2)
    db.add(oferta)
    db.commit()

    resultado = solver_service.gerar_grade(semestre.id, db)
    assert resultado.sucesso is True

    alocacoes = db.query(Alocacao).filter(Alocacao.oferta_id == oferta.id).all()
    horario_ids = [a.horario_id for a in alocacoes]
    horarios_obj = {h.id: h for h in db.query(Horario).filter(Horario.id.in_(horario_ids)).all()}

    for a in alocacoes:
        h = horarios_obj[a.horario_id]
        assert h.turno == "MANHA", f"Slot de {h.turno} alocado com prefere_manha=True"
