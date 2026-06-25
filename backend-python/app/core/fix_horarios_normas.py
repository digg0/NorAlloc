"""Corrige os horários já cadastrados para bater exatamente com a grade
oficial do NORMAS.pdf (o 3º/4º slot da manhã eram 09:50/10:50 e passam a
ser 09:45/10:45; o 3º/4º da tarde eram 15:25/16:25 e passam a ser
15:20/16:20).

Atualiza as linhas existentes EM VEZ de apagar/recriar, preservando os IDs
— Alocacao e DisponibilidadeTurma que já referenciam esses horários
continuam válidas.

    python -m app.core.fix_horarios_normas
"""
from collections import defaultdict

from app.core.database import SessionLocal
from app.core.seed_dados_teste import SLOTS_PADRAO
from app.models.horario import Horario


def fix_horarios_normas() -> None:
    db = SessionLocal()
    try:
        novos_por_turno = defaultdict(list)
        for turno, hora_inicio, hora_fim in SLOTS_PADRAO:
            novos_por_turno[turno].append((hora_inicio, hora_fim))

        horarios = db.query(Horario).all()
        por_dia_turno = defaultdict(list)
        for h in horarios:
            por_dia_turno[(h.dia_semana, h.turno)].append(h)

        atualizados = 0
        for (dia, turno), lista in por_dia_turno.items():
            lista.sort(key=lambda h: h.hora_inicio)
            novos = novos_por_turno.get(turno, [])
            for horario, (hora_inicio, hora_fim) in zip(lista, novos):
                if horario.hora_inicio != hora_inicio or horario.hora_fim != hora_fim:
                    horario.hora_inicio = hora_inicio
                    horario.hora_fim = hora_fim
                    atualizados += 1

        db.commit()
        print(f"{atualizados} horário(s) corrigido(s) conforme NORMAS.pdf.")
    finally:
        db.close()


if __name__ == "__main__":
    fix_horarios_normas()
