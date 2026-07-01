"""Teste do solver Z3 com dados reais do banco (Postgres via Docker).

Usa o semestre 2026.1 já populado pelo seed (turmas ADS1, ADS2, REDES1,
professores reais, 65 horários IFCE). Roda o solver e exibe a grade no
terminal. Faz rollback no final — nenhum dado é persistido.

Execução (dentro do container):
    docker compose exec backend python tests/teste_solver.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.models.alocacao import Alocacao
from app.models.horario import Horario
from app.models.oferta_disciplina import OfertaDisciplina
from app.models.professor import Professor
from app.models.semestre import Semestre
from app.models.turma import Turma
from app.services import solver_service, validacao_service

NOME_SEMESTRE = "2026.1"
COL = 66


def main() -> None:
    db = SessionLocal()
    try:
        semestre = db.query(Semestre).filter(Semestre.nome == NOME_SEMESTRE).first()
        if not semestre:
            print(f"\n  Semestre '{NOME_SEMESTRE}' não encontrado. Rode o seed primeiro.")
            return

        turmas = db.query(Turma).filter(Turma.semestre_id == semestre.id).all()
        turma_ids = [t.id for t in turmas]
        ofertas = (
            db.query(OfertaDisciplina)
            .filter(OfertaDisciplina.turma_id.in_(turma_ids))
            .all()
        )
        total_horarios = db.query(Horario).count()

        print(f"\n{'=' * COL}")
        print(f"  TESTE SOLVER — {NOME_SEMESTRE}  (dados reais, rollback ao final)")
        print(f"{'=' * COL}")
        print(f"  Turmas       : {len(turmas)}   ({', '.join(t.nome for t in turmas)})")
        print(f"  Ofertas      : {len(ofertas)}")
        print(f"  Horários     : {total_horarios}  (5 dias × 13 slots IFCE)")
        print(f"{'─' * COL}")
        print("  Executando solver Z3...")
        print(f"{'─' * COL}")

        # Savepoint: db.commit() dentro do solver libera o savepoint mas não
        # commita na transação externa — db.rollback() ao final desfaz tudo.
        db.begin_nested()
        resultado = solver_service.gerar_grade(semestre_id=semestre.id, db=db)

        status = "SUCESSO" if resultado.sucesso else "FALHA"
        print(f"  Resultado    : {status}")
        print(f"  Mensagem     : {resultado.mensagem}")
        print(f"  Alocações    : {resultado.total_alocacoes}")
        print(f"{'=' * COL}")

        if resultado.sucesso:
            _exibir_grade(db, turmas, ofertas)
            _exibir_alertas(db, semestre.id)

    finally:
        print(f"\n{'─' * COL}")
        print("  Rollback — nenhuma alteração persistida no banco.")
        print(f"{'─' * COL}\n")
        db.rollback()
        db.close()


def _exibir_grade(db, turmas, ofertas) -> None:
    turma_by_id = {t.id: t for t in turmas}
    oferta_by_id = {o.id: o for o in ofertas}

    prof_ids = {o.professor_id for o in ofertas if o.professor_id}
    profs = (
        {p.id: p for p in db.query(Professor).filter(Professor.id.in_(prof_ids)).all()}
        if prof_ids else {}
    )

    aloc_ids = list(oferta_by_id.keys())
    alocacoes = db.query(Alocacao).filter(Alocacao.oferta_id.in_(aloc_ids)).all()

    horario_ids = {a.horario_id for a in alocacoes}
    horarios = (
        {h.id: h for h in db.query(Horario).filter(Horario.id.in_(horario_ids)).all()}
        if horario_ids else {}
    )

    # Agrupa alocações por turma
    por_turma: dict = {}
    for aloc in alocacoes:
        oferta = oferta_by_id.get(aloc.oferta_id)
        if oferta:
            por_turma.setdefault(oferta.turma_id, []).append((aloc, oferta))

    DIAS = {"SEGUNDA": 0, "TERCA": 1, "QUARTA": 2, "QUINTA": 3, "SEXTA": 4}
    TURNOS = {"MANHA": 0, "TARDE": 1, "NOITE": 2}

    for turma_id in sorted(por_turma, key=lambda tid: turma_by_id[tid].nome):
        turma = turma_by_id[turma_id]
        lista = por_turma[turma_id]

        lista.sort(key=lambda x: (
            DIAS.get(horarios[x[0].horario_id].dia_semana, 9),
            TURNOS.get(horarios[x[0].horario_id].turno, 9),
            horarios[x[0].horario_id].hora_inicio,
        ))

        print(f"\n  TURMA: {turma.nome}")
        print(f"  {'DIA':<10} {'HORÁRIO':<14} {'DISCIPLINA':<36} PROFESSOR")
        print(f"  {'─'*10} {'─'*14} {'─'*36} {'─'*26}")

        for aloc, oferta in lista:
            h = horarios[aloc.horario_id]
            inicio = h.hora_inicio.strftime("%H:%M")
            fim = h.hora_fim.strftime("%H:%M")
            disc = oferta.disciplina.nome if oferta.disciplina else f"disc#{oferta.disciplina_id}"
            prof = profs[oferta.professor_id].nome if oferta.professor_id in profs else "—"
            # Abrevia nomes longos de disciplina
            if len(disc) > 35:
                disc = disc[:33] + ".."
            print(f"  {h.dia_semana:<10} {inicio}–{fim:<8} {disc:<36} {prof}")


def _exibir_alertas(db, semestre_id: int) -> None:
    alertas = validacao_service.validar_semestre(semestre_id=semestre_id, db=db)
    print(f"\n{'─' * COL}")
    if not alertas:
        print("  Alertas      : nenhum — grade consistente.")
    else:
        print(f"  Alertas      : {len(alertas)}")
        for a in alertas:
            print(f"  [{a['tipo']}] {a['descricao']}")
    print(f"{'─' * COL}")


if __name__ == "__main__":
    main()
