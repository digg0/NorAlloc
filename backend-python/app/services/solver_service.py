"""Solver de geração automática de grade horária, usando Z3.

Entrada: ofertas de disciplina do semestre, disponibilidade de professores e
turmas, e preferências dos professores.

Restrições *hard* (obrigatórias): carga horária semanal exata de cada oferta,
sem dois compromissos do mesmo professor no mesmo horário, sem duas
disciplinas da mesma turma no mesmo horário, professor afastado nunca recebe
aula, e o limite de aulas por dia (`max_aulas_dia`) quando informado.

Restrições *soft* (preferências, maximizadas via z3.Optimize): evitar
sexta-feira, preferir manhã, preferir blocos duplos (aulas em horários
consecutivos no mesmo dia).

Sobrecarga e janelas entre aulas não são tratadas aqui: a spec as define como
alertas calculados dinamicamente (ver `validacao_service.py`), não como
restrições do solver.

Quando `curso_id` é informado (coordenador logado, restrito ao próprio
curso), a geração abrange só as turmas daquele curso — mas os horários que
professores compartilhados já ocupam em turmas de OUTROS cursos no mesmo
semestre continuam bloqueados, para não gerar conflito entre cursos.

Critério de desempate entre professores: quando as preferências de dois
professores disputam o mesmo horário (ex.: ambos preferem manhã, mas só um
slot está disponível), o professor mais antigo no campus (`data_ingresso`
mais antiga) tem prioridade; em caso de empate, vence o mais velho
(`data_nascimento` mais antiga). Isso é implementado multiplicando o peso
das restrições soft de cada professor por sua posição num ranking de
antiguidade — sem afetar as restrições hard (conflito, disponibilidade).
"""
from collections import defaultdict
from datetime import date
from typing import Dict, List, Optional, Tuple

from sqlalchemy.orm import Session
from z3 import And, Bool, If, Not, Optimize, Sum, is_true, sat

from app.models.alocacao import Alocacao
from app.models.disponibilidade import Restricao
from app.models.disponibilidade_turma import DisponibilidadeTurma
from app.models.horario import Horario
from app.models.oferta_disciplina import OfertaDisciplina
from app.models.preferencias_professor import PreferenciaProfessor
from app.models.professor import Professor
from app.models.turma import Turma
from app.schemas.alocacao import GerarGradeResponse

DIA_CURTO = {
    "SEGUNDA": "SEG",
    "TERCA": "TER",
    "QUARTA": "QUA",
    "QUINTA": "QUI",
    "SEXTA": "SEX",
    "SABADO": "SAB",
}
TURNO_LETRA = {"MANHA": "M", "TARDE": "T", "NOITE": "N"}


def _slot_codes_por_horario(horarios: List[Horario]) -> Dict[int, str]:
    """Mapeia cada Horario para um código DIA_SLOT (ex.: "SEG_M1").

    O índice do slot é a posição do horário, ordenado por hora_inicio, dentro
    do mesmo dia_semana+turno — é o mesmo padrão usado em
    `Restricao.horarios_bloqueados` (disponibilidade do professor).
    """
    grupos: Dict[Tuple[str, str], List[Horario]] = defaultdict(list)
    for h in horarios:
        grupos[(h.dia_semana, h.turno)].append(h)

    codigos: Dict[int, str] = {}
    for (dia, turno), lista in grupos.items():
        dia_c = DIA_CURTO.get(dia)
        letra = TURNO_LETRA.get(turno)
        if not dia_c or not letra:
            continue
        lista.sort(key=lambda h: h.hora_inicio)
        for indice, h in enumerate(lista, start=1):
            codigos[h.id] = f"{dia_c}_{letra}{indice}"
    return codigos


def _calcular_prioridade_professores(professores: Dict[int, Professor]) -> Dict[int, int]:
    """Ranking de antiguidade: data_ingresso mais antiga vence; em empate,
    data_nascimento mais antiga vence. Retorna um multiplicador de peso
    (maior = mais prioridade) para usar nas restrições soft do professor."""
    ordenados = sorted(
        professores.values(),
        key=lambda p: (p.data_ingresso or date.max, p.data_nascimento or date.max),
    )
    total = len(ordenados)
    return {p.id: total - indice for indice, p in enumerate(ordenados)}


def gerar_grade(semestre_id: int, db: Session, curso_id: Optional[int] = None) -> GerarGradeResponse:
    """Gera a grade do semestre. Se `curso_id` for informado (coordenador
    logado), gera apenas para as turmas daquele curso — mas continua
    respeitando os horários já ocupados por professores compartilhados em
    turmas de outros cursos no mesmo semestre."""
    query_turmas = db.query(Turma).filter(Turma.semestre_id == semestre_id)
    if curso_id is not None:
        query_turmas = query_turmas.filter(Turma.curso_id == curso_id)
    turmas = query_turmas.all()
    turma_ids = [t.id for t in turmas]
    if not turma_ids:
        return GerarGradeResponse(
            sucesso=False,
            mensagem="Nenhuma turma encontrada para este semestre.",
            total_alocacoes=0,
        )

    ofertas = (
        db.query(OfertaDisciplina)
        .filter(OfertaDisciplina.turma_id.in_(turma_ids))
        .all()
    )
    if not ofertas:
        return GerarGradeResponse(
            sucesso=False,
            mensagem="Nenhuma oferta de disciplina cadastrada para este semestre.",
            total_alocacoes=0,
        )

    horarios = db.query(Horario).all()
    if not horarios:
        return GerarGradeResponse(
            sucesso=False,
            mensagem="Nenhum horário cadastrado no sistema.",
            total_alocacoes=0,
        )

    slot_codes = _slot_codes_por_horario(horarios)

    disponibilidades_turma = (
        db.query(DisponibilidadeTurma)
        .filter(DisponibilidadeTurma.turma_id.in_(turma_ids))
        .all()
    )
    disp_turma_map = {(d.turma_id, d.horario_id): d.disponivel for d in disponibilidades_turma}

    professor_ids = {o.professor_id for o in ofertas if o.professor_id}
    professores = (
        {p.id: p for p in db.query(Professor).filter(Professor.id.in_(professor_ids)).all()}
        if professor_ids
        else {}
    )
    restricoes = (
        db.query(Restricao)
        .filter(Restricao.professor_id.in_(professor_ids), Restricao.semestre_id == semestre_id)
        .all()
        if professor_ids
        else []
    )
    bloqueios_professor = {r.professor_id: set(r.horarios_bloqueados or []) for r in restricoes}

    # Horários que professores compartilhados já ocupam em turmas de OUTROS
    # cursos no mesmo semestre (relevante quando curso_id restringe a busca
    # a um único curso, mas o professor também leciona em outro).
    ocupados_externos: Dict[int, set] = defaultdict(set)
    if professor_ids:
        outras_alocacoes = (
            db.query(OfertaDisciplina.professor_id, Alocacao.horario_id)
            .join(Alocacao, Alocacao.oferta_id == OfertaDisciplina.id)
            .join(Turma, OfertaDisciplina.turma_id == Turma.id)
            .filter(
                Turma.semestre_id == semestre_id,
                Turma.id.notin_(turma_ids),
                OfertaDisciplina.professor_id.in_(professor_ids),
            )
            .all()
        )
        for professor_id, horario_id in outras_alocacoes:
            ocupados_externos[professor_id].add(horario_id)

    preferencias_map = (
        {
            p.professor_id: p
            for p in db.query(PreferenciaProfessor)
            .filter(PreferenciaProfessor.professor_id.in_(professor_ids))
            .all()
        }
        if professor_ids
        else {}
    )

    def turma_disponivel(turma_id: int, horario_id: int) -> bool:
        return disp_turma_map.get((turma_id, horario_id), True)

    def professor_disponivel(professor_id: int, horario_id: int) -> bool:
        if horario_id in ocupados_externos.get(professor_id, set()):
            return False
        codigo = slot_codes.get(horario_id)
        return not (codigo and codigo in bloqueios_professor.get(professor_id, set()))

    elegiveis: Dict[int, List[Horario]] = {}
    for o in ofertas:
        professor = professores.get(o.professor_id) if o.professor_id else None
        if not o.professor_id or (professor and professor.afastado):
            elegiveis[o.id] = []
            continue
        elegiveis[o.id] = [
            h
            for h in horarios
            if turma_disponivel(o.turma_id, h.id) and professor_disponivel(o.professor_id, h.id)
        ]

    insuficientes = [o for o in ofertas if len(elegiveis[o.id]) < o.carga_horaria]
    if insuficientes:
        descricao = ", ".join(f"oferta #{o.id}" for o in insuficientes)
        return GerarGradeResponse(
            sucesso=False,
            mensagem=(
                "Não há horários elegíveis suficientes para atender a carga horária de: "
                f"{descricao}. Revise disponibilidades, afastamentos e cadastro de horários."
            ),
            total_alocacoes=0,
        )

    opt = Optimize()
    x = {
        (o.id, h.id): Bool(f"x_{o.id}_{h.id}")
        for o in ofertas
        for h in elegiveis[o.id]
    }

    # Hard: carga horária semanal exata de cada oferta.
    for o in ofertas:
        variaveis = [x[(o.id, h.id)] for h in elegiveis[o.id]]
        opt.add(Sum([If(v, 1, 0) for v in variaveis]) == o.carga_horaria)

    # Hard: sem dois compromissos do mesmo professor no mesmo horário.
    por_professor_horario: Dict[Tuple[int, int], list] = defaultdict(list)
    for o in ofertas:
        if not o.professor_id:
            continue
        for h in elegiveis[o.id]:
            por_professor_horario[(o.professor_id, h.id)].append(x[(o.id, h.id)])
    for variaveis in por_professor_horario.values():
        if len(variaveis) > 1:
            opt.add(Sum([If(v, 1, 0) for v in variaveis]) <= 1)

    # Hard: sem duas disciplinas da mesma turma no mesmo horário.
    por_turma_horario: Dict[Tuple[int, int], list] = defaultdict(list)
    for o in ofertas:
        for h in elegiveis[o.id]:
            por_turma_horario[(o.turma_id, h.id)].append(x[(o.id, h.id)])
    for variaveis in por_turma_horario.values():
        if len(variaveis) > 1:
            opt.add(Sum([If(v, 1, 0) for v in variaveis]) <= 1)

    # Hard: limite de aulas por dia, quando o professor tiver essa preferência.
    por_professor_dia: Dict[Tuple[int, str], list] = defaultdict(list)
    for o in ofertas:
        if not o.professor_id:
            continue
        pref = preferencias_map.get(o.professor_id)
        if not pref or not pref.max_aulas_dia:
            continue
        for h in elegiveis[o.id]:
            por_professor_dia[(o.professor_id, h.dia_semana)].append(x[(o.id, h.id)])
    for (professor_id, _dia), variaveis in por_professor_dia.items():
        pref = preferencias_map[professor_id]
        opt.add(Sum([If(v, 1, 0) for v in variaveis]) <= pref.max_aulas_dia)

    # Soft: preferências não obrigatórias do professor, ponderadas pelo
    # ranking de antiguidade (desempate: data_ingresso, depois data_nascimento).
    prioridade = _calcular_prioridade_professores(professores)
    for o in ofertas:
        if not o.professor_id:
            continue
        pref = preferencias_map.get(o.professor_id)
        if not pref:
            continue
        peso_prioridade = prioridade.get(o.professor_id, 1)
        for h in elegiveis[o.id]:
            var = x[(o.id, h.id)]
            if pref.evitar_sexta and h.dia_semana == "SEXTA":
                opt.add_soft(Not(var), weight=3 * peso_prioridade)
            if pref.prefere_manha and h.turno != "MANHA":
                opt.add_soft(Not(var), weight=2 * peso_prioridade)

        if pref.prefere_aula_dupla:
            por_dia: Dict[str, List[Horario]] = defaultdict(list)
            for h in elegiveis[o.id]:
                por_dia[h.dia_semana].append(h)
            for lista in por_dia.values():
                lista.sort(key=lambda hh: hh.hora_inicio)
                for h1, h2 in zip(lista, lista[1:]):
                    if h1.hora_fim == h2.hora_inicio:
                        opt.add_soft(And(x[(o.id, h1.id)], x[(o.id, h2.id)]), weight=2 * peso_prioridade)

    if opt.check() != sat:
        return GerarGradeResponse(
            sucesso=False,
            mensagem="O solver não encontrou uma grade válida com as restrições atuais.",
            total_alocacoes=0,
        )

    modelo = opt.model()
    novas_alocacoes = [
        (oferta_id, horario_id)
        for (oferta_id, horario_id), var in x.items()
        if is_true(modelo.eval(var, model_completion=True))
    ]

    oferta_ids = [o.id for o in ofertas]
    db.query(Alocacao).filter(Alocacao.oferta_id.in_(oferta_ids)).delete(synchronize_session=False)
    for oferta_id, horario_id in novas_alocacoes:
        db.add(Alocacao(oferta_id=oferta_id, horario_id=horario_id))
    db.commit()

    return GerarGradeResponse(
        sucesso=True,
        mensagem="Grade gerada com sucesso.",
        total_alocacoes=len(novas_alocacoes),
    )
