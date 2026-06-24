import { useEffect, useMemo, useState } from 'react';
import { listarTurmasBackend, type TurmaBackendUI } from '../services/turmasBackend';
import { listarHorarios, type HorarioUI, DIAS_SEMANA } from '../services/horarios';
import {
  listarDisponibilidadeTurma,
  criarDisponibilidadeTurma,
  atualizarDisponibilidadeTurma,
  type DisponibilidadeTurmaUI,
} from '../services/disponibilidadeTurma';

const DIA_LABEL: Record<string, string> = {
  SEGUNDA: 'Seg', TERCA: 'Ter', QUARTA: 'Qua', QUINTA: 'Qui', SEXTA: 'Sex', SABADO: 'Sáb',
};

export function DisponibilidadeTurmaView() {
  const [turmas, setTurmas] = useState<TurmaBackendUI[]>([]);
  const [horarios, setHorarios] = useState<HorarioUI[]>([]);
  const [disponibilidades, setDisponibilidades] = useState<DisponibilidadeTurmaUI[]>([]);
  const [turmaId, setTurmaId] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [salvandoId, setSalvandoId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([listarTurmasBackend(), listarHorarios(), listarDisponibilidadeTurma()])
      .then(([t, h, d]) => {
        setTurmas(t);
        setHorarios(h);
        setDisponibilidades(d);
        if (t.length > 0) setTurmaId(t[0].id);
        setErro('');
      })
      .catch((err) => setErro(err?.message || 'Falha ao carregar disponibilidade de turmas.'))
      .finally(() => setLoading(false));
  }, []);

  const porDiaTurno = useMemo(() => {
    const grupos: Record<string, HorarioUI[]> = {};
    for (const h of horarios) {
      const chave = `${h.diaSemana}_${h.turno}`;
      (grupos[chave] ??= []).push(h);
    }
    Object.values(grupos).forEach((lista) => lista.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)));
    return grupos;
  }, [horarios]);

  const turnos = ['MANHA', 'TARDE', 'NOITE'];

  const registroPara = (horarioId: number) =>
    disponibilidades.find((d) => d.turmaId === turmaId && d.horarioId === horarioId);

  const alternar = async (horarioId: number) => {
    const registro = registroPara(horarioId);
    setSalvandoId(horarioId);
    try {
      if (registro) {
        const atualizado = await atualizarDisponibilidadeTurma(registro.id, turmaId, horarioId, !registro.disponivel);
        setDisponibilidades((ds) => ds.map((d) => (d.id === registro.id ? atualizado : d)));
      } else {
        // Sem registro = disponível por padrão; primeiro clique marca como indisponível.
        const novo = await criarDisponibilidadeTurma(turmaId, horarioId, false);
        setDisponibilidades((ds) => [...ds, novo]);
      }
    } catch (err: any) {
      setErro(err?.message || 'Erro ao atualizar disponibilidade.');
    } finally {
      setSalvandoId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600">Turma:</label>
        <select
          value={turmaId}
          onChange={(e) => setTurmaId(Number(e.target.value))}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          {turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </select>
        <p className="text-xs text-gray-400">Clique em um horário para marcar/desmarcar indisponibilidade da turma.</p>
      </div>

      {erro && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{erro}</div>}

      {loading ? (
        <p className="text-sm text-gray-400">Carregando…</p>
      ) : turmas.length === 0 ? (
        <p className="text-sm text-gray-400">Nenhuma turma cadastrada.</p>
      ) : (
        <div className="bg-white border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-3 py-2.5">Turno</th>
                {DIAS_SEMANA.map((dia) => (
                  <th key={dia} className="text-center px-3 py-2.5">{DIA_LABEL[dia]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {turnos.map((turno) => (
                <tr key={turno}>
                  <td className="px-3 py-2.5 font-medium text-gray-600">{turno}</td>
                  {DIAS_SEMANA.map((dia) => {
                    const lista = porDiaTurno[`${dia}_${turno}`] ?? [];
                    return (
                      <td key={dia} className="px-2 py-2 text-center">
                        <div className="flex flex-col gap-1 items-center">
                          {lista.map((h) => {
                            const registro = registroPara(h.id);
                            const disponivel = registro ? registro.disponivel : true;
                            return (
                              <button
                                key={h.id}
                                disabled={salvandoId === h.id}
                                onClick={() => alternar(h.id)}
                                title={`${h.horaInicio} - ${h.horaFim}`}
                                className={`w-16 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                                  disponivel
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                                    : 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
                                } ${salvandoId === h.id ? 'opacity-50' : ''}`}
                              >
                                {h.horaInicio.slice(0, 5)}
                              </button>
                            );
                          })}
                          {lista.length === 0 && <span className="text-gray-300 text-xs">—</span>}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
