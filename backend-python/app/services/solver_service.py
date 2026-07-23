"""Solver de geração automática de grade horária, usando Z3.

Entrada: ofertas de disciplina do semestre, disponibilidade de professores e
turmas, e preferências dos professores.

Restrições *hard* (obrigatórias): carga horária semanal exata de cada oferta,
sem dois compromissos do mesmo professor no mesmo horário, sem duas
disciplinas da mesma turma no mesmo horário, professor afastado nunca recebe
aula, o limite de aulas por dia (`max_aulas_dia`) quando informado, e o
limite de carga horária semanal do professor (`Professor.carga_maxima`,
NORMAS.pdf) somando o que ele já está alocado em OUTROS cursos no mesmo
semestre — não só o que está sendo gerado agora.

Restrições *soft* (preferências, maximizadas via z3.Optimize): preferir
manhã, preferir blocos duplos (aulas em horários consecutivos no mesmo
dia), limitar cada oferta a no máximo 2 slots por dia (distribui
disciplinas de 4h em pelo menos 2 dias), evitar sexta-feira quando
configurado em `PreferenciaProfessor.evitar_sexta`, penalizar janelas
maiores que 60 min entre aulas do mesmo professor no mesmo dia
(`evitar_janelas`) e respeitar mínimo de aulas por dia (`min_aulas_dia`).
O foco é aproximar a alocação da disponibilidade/preferência real do
professor.

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
from datetime import date, datetime
from typing import Dict, List, Optional, Tuple

from sqlalchemy.orm import Session
from z3 import And, Bool, If, Not, Optimize, Or, Solver, Sum, is_true, sat, unknown

from app.core.regras_carga import max_creditos_semanais
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

_JANELA_MAXIMA_MINUTOS = 60


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


def _gap_minutos(hora_fim, hora_inicio) -> int:
    base = datetime(2000, 1, 1)
    t1 = datetime.combine(base.date(), hora_fim)
    t2 = datetime.combine(base.date(), hora_inicio)
    return max(0, int((t2 - t1).total_seconds() // 60))


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


def limpar_grade(semestre_id: int, db: Session, curso_id: Optional[int] = None) -> int:
    """Remove todas as alocações do semestre (ou só do curso do coordenador,
    quando informado), sem tocar nas ofertas/turmas/disciplinas. Retorna
    quantas alocações foram removidas."""
    query_turmas = db.query(Turma).filter(Turma.semestre_id == semestre_id)
    if curso_id is not None:
        query_turmas = query_turmas.filter(Turma.curso_id == curso_id)
    turma_ids = [t.id for t in query_turmas.all()]
    if not turma_ids:
        return 0

    oferta_ids = [
        o.id for o in db.query(OfertaDisciplina).filter(OfertaDisciplina.turma_id.in_(turma_ids)).all()
    ]
    if not oferta_ids:
        return 0

    removidas = (
        db.query(Alocacao)
        .filter(Alocacao.oferta_id.in_(oferta_ids))
        .delete(synchronize_session=False)
    )
    db.commit()
    return removidas


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

    # Carga (em créditos/aulas semanais) que cada professor já tem
    # comprometida em ofertas de OUTROS cursos no mesmo semestre — conta
    # contra o limite de carga_maxima dele mesmo fora deste curso/turma.
    carga_externa_professor: Dict[int, int] = defaultdict(int)
    if professor_ids:
        outras_ofertas = (
            db.query(OfertaDisciplina.professor_id, OfertaDisciplina.carga_horaria)
            .join(Turma, OfertaDisciplina.turma_id == Turma.id)
            .filter(
                Turma.semestre_id == semestre_id,
                Turma.id.notin_(turma_ids),
                OfertaDisciplina.professor_id.in_(professor_ids),
            )
            .all()
        )
        for professor_id, carga in outras_ofertas:
            carga_externa_professor[professor_id] += carga or 0

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

    # Checagem prévia do limite de carga semanal (NORMAS.pdf): número de
    # créditos pedidos neste curso + o que o professor já tem em outros
    # cursos não pode passar do equivalente em créditos de carga_maxima.
    carga_pedida_professor: Dict[int, int] = defaultdict(int)
    for o in ofertas:
        if o.professor_id:
            carga_pedida_professor[o.professor_id] += o.carga_horaria
    sobrecarregados = []
    for professor_id, carga_pedida in carga_pedida_professor.items():
        professor = professores.get(professor_id)
        if not professor or not professor.carga_maxima:
            continue
        limite_creditos = max_creditos_semanais(professor.carga_maxima)
        total = carga_pedida + carga_externa_professor.get(professor_id, 0)
        if total > limite_creditos:
            sobrecarregados.append((professor, total, limite_creditos))
    if sobrecarregados:
        descricao = "; ".join(
            f"{p.nome}: {total} créditos solicitados (limite {limite} para {p.carga_maxima}h/semana)"
            for p, total, limite in sobrecarregados
        )
        return GerarGradeResponse(
            sucesso=False,
            mensagem=f"Professor(es) acima da carga horária máxima semanal: {descricao}.",
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

    # Soft: distribuição por dias — cada oferta usa no máximo 2 slots por
    # dia, incentivando o padrão 2+2 para disciplinas de 4h e reduzindo a
    # concentração de toda a carga numa única segunda-feira.
    _por_oferta_dia: Dict[Tuple[int, str], list] = defaultdict(list)
    for o in ofertas:
        for h in elegiveis[o.id]:
            _por_oferta_dia[(o.id, h.dia_semana)].append(x[(o.id, h.id)])
    for vars_dia in _por_oferta_dia.values():
        if len(vars_dia) > 2:
            opt.add_soft(Sum([If(v, 1, 0) for v in vars_dia]) <= 2, weight=2)

    # Soft: evitar_sexta, evitar_janelas, min_aulas_dia.
    # Agrega vars por (professor, dia, horario_id) para os loops abaixo.
    _prof_dia_slots: Dict[Tuple[int, str], Dict[int, list]] = {}
    for o in ofertas:
        if not o.professor_id:
            continue
        for h in elegiveis[o.id]:
            key = (o.professor_id, h.dia_semana)
            if key not in _prof_dia_slots:
                _prof_dia_slots[key] = defaultdict(list)
            _prof_dia_slots[key][h.id].append(x[(o.id, h.id)])

    _horario_by_id: Dict[int, Horario] = {h.id: h for h in horarios}

    # evitar_sexta: penaliza slots de sexta para quem tem a preferência.
    for o in ofertas:
        if not o.professor_id:
            continue
        pref = preferencias_map.get(o.professor_id)
        if not pref or not pref.evitar_sexta:
            continue
        peso_p = prioridade.get(o.professor_id, 1)
        for h in elegiveis[o.id]:
            if h.dia_semana == "SEXTA":
                opt.add_soft(Not(x[(o.id, h.id)]), weight=3 * peso_p)

    # evitar_janelas e min_aulas_dia: iterar por (professor, dia).
    for (professor_id, dia), slots in _prof_dia_slots.items():
        pref = preferencias_map.get(professor_id)
        if not pref:
            continue
        peso_p = prioridade.get(professor_id, 1)

        if pref.evitar_janelas:
            horarios_dia = sorted(
                [_horario_by_id[h_id] for h_id in slots],
                key=lambda h: h.hora_inicio,
            )
            for i, h1 in enumerate(horarios_dia):
                for h2 in horarios_dia[i + 1:]:
                    if _gap_minutos(h1.hora_fim, h2.hora_inicio) > _JANELA_MAXIMA_MINUTOS:
                        vs1, vs2 = slots[h1.id], slots[h2.id]
                        occ1 = vs1[0] if len(vs1) == 1 else Or(vs1)
                        occ2 = vs2[0] if len(vs2) == 1 else Or(vs2)
                        opt.add_soft(Not(And(occ1, occ2)), weight=2 * peso_p)

        if pref.min_aulas_dia:
            all_vars = [v for vs in slots.values() for v in vs]
            total = Sum([If(v, 1, 0) for v in all_vars])
            opt.add_soft(
                Or(total == 0, total >= pref.min_aulas_dia),
                weight=2 * peso_p,
            )

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


# ==========================
# PROPOSTAS (sem salvar)
# ==========================

import random as _random

from app.schemas.horario import HorarioResponse
from app.schemas.oferta_disciplina import OfertaDisciplinaResponse


def _gerar_proposta_greedy(
    ofertas: List[OfertaDisciplina],
    elegiveis: Dict[int, List[Horario]],
    seed: int,
) -> List[Tuple[int, int]]:
    """Greedy randomizado: embaralha ordem das ofertas e slots para gerar
    uma grade alternativa respeitando restrições hard (sem double-booking)."""
    rng = _random.Random(seed)
    ocupado_prof: Dict[int, set] = defaultdict(set)
    ocupado_turma: Dict[int, set] = defaultdict(set)
    resultado: List[Tuple[int, int]] = []

    shuffled = list(ofertas)
    rng.shuffle(shuffled)

    for o in shuffled:
        disponiveis = [
            h for h in elegiveis[o.id]
            if h.id not in ocupado_prof.get(o.professor_id or -1, set())
            and h.id not in ocupado_turma.get(o.turma_id, set())
        ]
        rng.shuffle(disponiveis)
        escolhidos = disponiveis[: o.carga_horaria]
        for h in escolhidos:
            resultado.append((o.id, h.id))
            if o.professor_id:
                ocupado_prof[o.professor_id].add(h.id)
            ocupado_turma[o.turma_id].add(h.id)

    return resultado


def _pares_para_itens(
    pares: List[Tuple[int, int]],
    oferta_map: Dict[int, OfertaDisciplina],
    horario_map: Dict[int, Horario],
):
    """Converte pares (oferta_id, horario_id) em PropostaItemResponse."""
    from app.schemas.alocacao import PropostaItemResponse

    itens = []
    for oferta_id, horario_id in pares:
        oferta = oferta_map.get(oferta_id)
        horario = horario_map.get(horario_id)
        itens.append(
            PropostaItemResponse(
                oferta_id=oferta_id,
                horario_id=horario_id,
                oferta=OfertaDisciplinaResponse.model_validate(oferta) if oferta else None,
                horario=HorarioResponse.model_validate(horario) if horario else None,
            )
        )
    return itens


def gerar_grade_propostas(
    semestre_id: int,
    db: Session,
    curso_id: Optional[int] = None,
):
    """Gera 3 propostas de grade sem salvar no banco usando Z3 com enumeração de soluções.

    Roda o solver Z3 até 3 vezes, bloqueando cada solução anterior para obter
    distribuições distintas mas igualmente válidas. Se o Z3 não encontrar
    solução suficiente (inviável), preenche com greedy randomizado como fallback.
    """
    query_turmas = db.query(Turma).filter(Turma.semestre_id == semestre_id)
    if curso_id is not None:
        query_turmas = query_turmas.filter(Turma.curso_id == curso_id)
    turmas = query_turmas.all()
    turma_ids = [t.id for t in turmas]
    if not turma_ids:
        raise ValueError("Nenhuma turma encontrada para este semestre.")

    ofertas = db.query(OfertaDisciplina).filter(OfertaDisciplina.turma_id.in_(turma_ids)).all()
    if not ofertas:
        raise ValueError("Nenhuma oferta de disciplina cadastrada para este semestre.")

    horarios = db.query(Horario).all()
    if not horarios:
        raise ValueError("Nenhum horário cadastrado no sistema.")

    slot_codes = _slot_codes_por_horario(horarios)
    oferta_map = {o.id: o for o in ofertas}
    horario_map = {h.id: h for h in horarios}

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

    def turma_disp(turma_id: int, horario_id: int) -> bool:
        return disp_turma_map.get((turma_id, horario_id), True)

    def prof_disp(professor_id: int, horario_id: int) -> bool:
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
            h for h in horarios
            if turma_disp(o.turma_id, h.id) and prof_disp(o.professor_id, h.id)
        ]

    insuficientes = [o for o in ofertas if len(elegiveis[o.id]) < o.carga_horaria]
    if insuficientes:
        descricao = ", ".join(f"oferta #{o.id}" for o in insuficientes)
        raise ValueError(
            f"Não há horários elegíveis suficientes para: {descricao}. "
            "Revise disponibilidades, afastamentos e cadastro de horários."
        )

    # Variáveis compartilhadas entre os dois solvers abaixo
    x = {
        (o.id, h.id): Bool(f"xp_{o.id}_{h.id}")
        for o in ofertas
        for h in elegiveis[o.id]
    }

    def _hard(s) -> None:
        """Adiciona as restrições hard ao solver/optimize s."""
        for o in ofertas:
            variaveis = [x[(o.id, h.id)] for h in elegiveis[o.id]]
            s.add(Sum([If(v, 1, 0) for v in variaveis]) == o.carga_horaria)

        ph: Dict[Tuple[int, int], list] = defaultdict(list)
        for o in ofertas:
            if not o.professor_id:
                continue
            for h in elegiveis[o.id]:
                ph[(o.professor_id, h.id)].append(x[(o.id, h.id)])
        for vs in ph.values():
            if len(vs) > 1:
                s.add(Sum([If(v, 1, 0) for v in vs]) <= 1)

        th: Dict[Tuple[int, int], list] = defaultdict(list)
        for o in ofertas:
            for h in elegiveis[o.id]:
                th[(o.turma_id, h.id)].append(x[(o.id, h.id)])
        for vs in th.values():
            if len(vs) > 1:
                s.add(Sum([If(v, 1, 0) for v in vs]) <= 1)

        for o in ofertas:
            if not o.professor_id:
                continue
            pref = preferencias_map.get(o.professor_id)
            if not pref or not pref.max_aulas_dia:
                continue
            pdm: Dict[str, list] = defaultdict(list)
            for h in elegiveis[o.id]:
                pdm[h.dia_semana].append(x[(o.id, h.id)])
            for vs in pdm.values():
                s.add(Sum([If(v, 1, 0) for v in vs]) <= pref.max_aulas_dia)

    def _extrair_pares(modelo) -> List[Tuple[int, int]]:
        return [
            (o_id, h_id)
            for (o_id, h_id), var in x.items()
            if is_true(modelo.eval(var, model_completion=True))
        ]

    # ── Proposta A: Z3 Optimize — solução otimizada com todas as soft constraints ─
    opt = Optimize()
    opt.set("timeout", 5000)  # 5 s máximo; greedy cobre o fallback
    _hard(opt)

    prioridade = _calcular_prioridade_professores(professores)
    for o in ofertas:
        if not o.professor_id:
            continue
        pref = preferencias_map.get(o.professor_id)
        if not pref:
            continue
        peso = prioridade.get(o.professor_id, 1)
        for h in elegiveis[o.id]:
            if pref.prefere_manha and h.turno != "MANHA":
                opt.add_soft(Not(x[(o.id, h.id)]), weight=2 * peso)
        if pref.prefere_aula_dupla:
            por_dia_p: Dict[str, List[Horario]] = defaultdict(list)
            for h in elegiveis[o.id]:
                por_dia_p[h.dia_semana].append(h)
            for lista in por_dia_p.values():
                lista.sort(key=lambda hh: hh.hora_inicio)
                for h1, h2 in zip(lista, lista[1:]):
                    if h1.hora_fim == h2.hora_inicio:
                        opt.add_soft(And(x[(o.id, h1.id)], x[(o.id, h2.id)]), weight=2 * peso)

    _por_oferta_dia: Dict[Tuple[int, str], list] = defaultdict(list)
    for o in ofertas:
        for h in elegiveis[o.id]:
            _por_oferta_dia[(o.id, h.dia_semana)].append(x[(o.id, h.id)])
    for vars_dia in _por_oferta_dia.values():
        if len(vars_dia) > 2:
            opt.add_soft(Sum([If(v, 1, 0) for v in vars_dia]) <= 2, weight=2)

    _prof_dia_slots: Dict[Tuple[int, str], Dict[int, list]] = {}
    for o in ofertas:
        if not o.professor_id:
            continue
        for h in elegiveis[o.id]:
            key = (o.professor_id, h.dia_semana)
            if key not in _prof_dia_slots:
                _prof_dia_slots[key] = defaultdict(list)
            _prof_dia_slots[key][h.id].append(x[(o.id, h.id)])

    _horario_by_id: Dict[int, Horario] = {h.id: h for h in horarios}

    for o in ofertas:
        if not o.professor_id:
            continue
        pref = preferencias_map.get(o.professor_id)
        if not pref or not pref.evitar_sexta:
            continue
        peso_p = prioridade.get(o.professor_id, 1)
        for h in elegiveis[o.id]:
            if h.dia_semana == "SEXTA":
                opt.add_soft(Not(x[(o.id, h.id)]), weight=3 * peso_p)

    for (professor_id, _dia), slots in _prof_dia_slots.items():
        pref = preferencias_map.get(professor_id)
        if not pref:
            continue
        peso_p = prioridade.get(professor_id, 1)
        if pref.evitar_janelas:
            horarios_dia = sorted(
                [_horario_by_id[h_id] for h_id in slots],
                key=lambda h: h.hora_inicio,
            )
            for i, h1 in enumerate(horarios_dia):
                for h2 in horarios_dia[i + 1:]:
                    if _gap_minutos(h1.hora_fim, h2.hora_inicio) > _JANELA_MAXIMA_MINUTOS:
                        vs1, vs2 = slots[h1.id], slots[h2.id]
                        occ1 = vs1[0] if len(vs1) == 1 else Or(vs1)
                        occ2 = vs2[0] if len(vs2) == 1 else Or(vs2)
                        opt.add_soft(Not(And(occ1, occ2)), weight=2 * peso_p)
        if pref.min_aulas_dia:
            all_vars = [v for vs in slots.values() for v in vs]
            total = Sum([If(v, 1, 0) for v in all_vars])
            opt.add_soft(Or(total == 0, total >= pref.min_aulas_dia), weight=2 * peso_p)

    propostas_pares: List[List[Tuple[int, int]]] = []
    if opt.check() == sat:
        propostas_pares.append(_extrair_pares(opt.model()))

    # ── Propostas B e C: Z3 SAT puro — variações rápidas bloqueando a anterior ─
    sat_s = Solver()
    sat_s.set("timeout", 2000)  # 2 s por check
    _hard(sat_s)
    if propostas_pares:
        sat_s.add(Or([Not(x[par]) for par in propostas_pares[0] if par in x]))

    for _ in range(2):
        if sat_s.check() != sat:
            break
        pares = _extrair_pares(sat_s.model())
        propostas_pares.append(pares)
        if len(propostas_pares) < 3:
            sat_s.add(Or([Not(x[par]) for par in pares if par in x]))

    # Greedy como fallback se o Z3 não encontrou soluções suficientes
    while len(propostas_pares) < 3:
        seed = [0, 42, 137][len(propostas_pares)]
        propostas_pares.append(_gerar_proposta_greedy(ofertas, elegiveis, seed=seed))

    return [_pares_para_itens(pares, oferta_map, horario_map) for pares in propostas_pares]


def aplicar_proposta(
    semestre_id: int,
    items: List[Tuple[int, int]],
    db: Session,
    curso_id: Optional[int] = None,
) -> GerarGradeResponse:
    """Limpa a grade do semestre e aplica a proposta escolhida."""
    limpar_grade(semestre_id, db, curso_id=curso_id)
    for oferta_id, horario_id in items:
        db.add(Alocacao(oferta_id=oferta_id, horario_id=horario_id))
    db.commit()
    return GerarGradeResponse(
        sucesso=True,
        mensagem=f"Proposta aplicada com sucesso. {len(items)} aula(s) alocada(s).",
        total_alocacoes=len(items),
    )
