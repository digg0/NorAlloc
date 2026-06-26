"""Cálculo dinâmico de alertas sobre a grade de um semestre.

Não existe tabela de alerta: tudo aqui é recalculado a partir de Alocacao,
OfertaDisciplina, Professor e Horario, conforme a spec ("Sistema de
Alertas" — calculados após geração automática ou edição manual).
"""
from collections import defaultdict
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.core.regras_carga import creditos_para_horas
from app.models.alocacao import Alocacao
from app.models.horario import Horario
from app.models.oferta_disciplina import OfertaDisciplina
from app.models.professor import Professor
from app.models.turma import Turma

JANELA_MAXIMA_MINUTOS = 60


def _gap_minutos(hora_fim, hora_inicio) -> int:
    base = datetime(2000, 1, 1)
    t1 = datetime.combine(base.date(), hora_fim)
    t2 = datetime.combine(base.date(), hora_inicio)
    return int((t2 - t1).total_seconds() // 60)


def validar_semestre(semestre_id: int, db: Session, curso_id: Optional[int] = None) -> List[dict]:
    """Calcula os alertas do semestre. Se `curso_id` for informado (coordenador
    logado), restringe o cálculo às turmas daquele curso."""
    query = db.query(Turma).filter(Turma.semestre_id == semestre_id)
    if curso_id is not None:
        query = query.filter(Turma.curso_id == curso_id)
    turmas = query.all()
    turma_by_id = {t.id: t for t in turmas}
    turma_ids = list(turma_by_id.keys())

    ofertas = (
        db.query(OfertaDisciplina).filter(OfertaDisciplina.turma_id.in_(turma_ids)).all()
        if turma_ids
        else []
    )
    oferta_by_id = {o.id: o for o in ofertas}
    oferta_ids = list(oferta_by_id.keys())

    alocacoes = (
        db.query(Alocacao).filter(Alocacao.oferta_id.in_(oferta_ids)).all()
        if oferta_ids
        else []
    )

    horario_ids = {a.horario_id for a in alocacoes}
    horarios = (
        {h.id: h for h in db.query(Horario).filter(Horario.id.in_(horario_ids)).all()}
        if horario_ids
        else {}
    )

    professor_ids = {o.professor_id for o in ofertas if o.professor_id}
    professores = (
        {p.id: p for p in db.query(Professor).filter(Professor.id.in_(professor_ids)).all()}
        if professor_ids
        else {}
    )

    alertas: List[dict] = []

    # Conflito de professor: mesmo professor em dois horários simultâneos.
    por_professor_horario: Dict[Tuple[int, int], list] = defaultdict(list)
    for a in alocacoes:
        oferta = oferta_by_id.get(a.oferta_id)
        if oferta and oferta.professor_id:
            por_professor_horario[(oferta.professor_id, a.horario_id)].append(a)
    for (professor_id, horario_id), lista in por_professor_horario.items():
        if len(lista) > 1:
            professor = professores.get(professor_id)
            alertas.append(
                {
                    "tipo": "CONFLITO_PROFESSOR",
                    "descricao": (
                        f"Professor {professor.nome if professor else professor_id} possui "
                        f"{len(lista)} aulas no mesmo horário (#{horario_id})."
                    ),
                    "entidade_tipo": "professor",
                    "entidade_id": professor_id,
                }
            )

    # Conflito de turma: duas disciplinas no mesmo horário.
    por_turma_horario: Dict[Tuple[int, int], list] = defaultdict(list)
    for a in alocacoes:
        oferta = oferta_by_id.get(a.oferta_id)
        if oferta:
            por_turma_horario[(oferta.turma_id, a.horario_id)].append(a)
    for (turma_id, horario_id), lista in por_turma_horario.items():
        if len(lista) > 1:
            turma = turma_by_id.get(turma_id)
            alertas.append(
                {
                    "tipo": "CONFLITO_TURMA",
                    "descricao": (
                        f"Turma {turma.nome if turma else turma_id} possui {len(lista)} "
                        f"disciplinas no mesmo horário (#{horario_id})."
                    ),
                    "entidade_tipo": "turma",
                    "entidade_id": turma_id,
                }
            )

    # Professor afastado recebendo aulas.
    for a in alocacoes:
        oferta = oferta_by_id.get(a.oferta_id)
        professor = professores.get(oferta.professor_id) if oferta and oferta.professor_id else None
        if professor and professor.afastado:
            alertas.append(
                {
                    "tipo": "PROFESSOR_AFASTADO",
                    "descricao": (
                        f"Professor {professor.nome} está afastado e possui aula alocada "
                        f"(oferta #{oferta.id})."
                    ),
                    "entidade_tipo": "professor",
                    "entidade_id": professor.id,
                }
            )

    # Disciplina sem horário: oferta criada sem nenhuma alocação.
    ofertas_com_alocacao = {a.oferta_id for a in alocacoes}
    for o in ofertas:
        if o.id not in ofertas_com_alocacao:
            nome_disciplina = o.disciplina.nome if o.disciplina else "disciplina"
            alertas.append(
                {
                    "tipo": "DISCIPLINA_SEM_HORARIO",
                    "descricao": f"Oferta #{o.id} ({nome_disciplina}) não possui nenhuma alocação.",
                    "entidade_tipo": "oferta",
                    "entidade_id": o.id,
                }
            )

    # Sobrecarga: professor acima da carga máxima — considera TODAS as
    # ofertas dele no semestre, mesmo em outros cursos (não só o curso
    # filtrado por `curso_id`), e converte créditos em horas pela regra de
    # 50 min/crédito do NORMAS.pdf.
    carga_por_professor: Dict[int, int] = defaultdict(int)
    if professor_ids:
        todas_ofertas_professores = (
            db.query(OfertaDisciplina.professor_id, OfertaDisciplina.carga_horaria)
            .join(Turma, OfertaDisciplina.turma_id == Turma.id)
            .filter(
                Turma.semestre_id == semestre_id,
                OfertaDisciplina.professor_id.in_(professor_ids),
            )
            .all()
        )
        for professor_id, carga in todas_ofertas_professores:
            carga_por_professor[professor_id] += carga or 0

    for professor_id, creditos in carga_por_professor.items():
        professor = professores.get(professor_id)
        if not professor or not professor.carga_maxima:
            continue
        horas = creditos_para_horas(creditos)
        if horas > professor.carga_maxima:
            alertas.append(
                {
                    "tipo": "SOBRECARGA",
                    "descricao": (
                        f"Professor {professor.nome} está com {horas:.1f}h ofertadas "
                        f"({creditos} aulas/semana) no semestre, acima do limite de "
                        f"{professor.carga_maxima}h."
                    ),
                    "entidade_tipo": "professor",
                    "entidade_id": professor_id,
                }
            )

    # Janelas: espaços excessivos entre aulas do mesmo professor no mesmo dia.
    por_professor_dia: Dict[Tuple[int, str], List[Horario]] = defaultdict(list)
    for a in alocacoes:
        oferta = oferta_by_id.get(a.oferta_id)
        horario = horarios.get(a.horario_id)
        if oferta and oferta.professor_id and horario:
            por_professor_dia[(oferta.professor_id, horario.dia_semana)].append(horario)
    for (professor_id, dia), lista_horarios in por_professor_dia.items():
        lista_horarios.sort(key=lambda h: h.hora_inicio)
        for h1, h2 in zip(lista_horarios, lista_horarios[1:]):
            gap = _gap_minutos(h1.hora_fim, h2.hora_inicio)
            if gap > JANELA_MAXIMA_MINUTOS:
                professor = professores.get(professor_id)
                alertas.append(
                    {
                        "tipo": "JANELA",
                        "descricao": (
                            f"Professor {professor.nome if professor else professor_id} tem uma "
                            f"janela de {gap} min em {dia}."
                        ),
                        "entidade_tipo": "professor",
                        "entidade_id": professor_id,
                    }
                )

    return alertas
