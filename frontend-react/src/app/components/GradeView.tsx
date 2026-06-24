import { useEffect, useMemo, useState } from 'react';
import { listarSemestres, type SemestreUI } from '../services/semestres';
import { listarTurmasBackend, type TurmaBackendUI } from '../services/turmasBackend';
import { listarDisciplinasBackend, type DisciplinaBackendUI } from '../services/disciplinasBackend';
import { listarProfessores, type ProfessorUI } from '../services/professores';
import { listarHorarios, type HorarioUI } from '../services/horarios';
import { gerarGrade, listarAlocacoesPorSemestre, moverAlocacao, type AlocacaoUI } from '../services/alocacoes';

const DIA_LABEL: Record<string, string> = {
  SEGUNDA: 'Segunda', TERCA: 'Terça', QUARTA: 'Quarta', QUINTA: 'Quinta', SEXTA: 'Sexta', SABADO: 'Sábado',
};

export function GradeView() {
  const [semestres, setSemestres] = useState<SemestreUI[]>([]);
  const [turmas, setTurmas] = useState<TurmaBackendUI[]>([]);
  const [disciplinas, setDisciplinas] = useState<DisciplinaBackendUI[]>([]);
  const [professores, setProfessores] = useState<ProfessorUI[]>([]);
  const [horarios, setHorarios] = useState<HorarioUI[]>([]);
  const [alocacoes, setAlocacoes] = useState<AlocacaoUI[]>([]);

  const [semestreId, setSemestreId] = useState<number>(0);
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [moverSelecao, setMoverSelecao] = useState<Record<number, number>>({});

  useEffect(() => {
    Promise.all([listarSemestres(), listarTurmasBackend(), listarDisciplinasBackend(), listarProfessores(), listarHorarios()])
      .then(([s, t, d, p, h]) => {
        setSemestres(s);
        setTurmas(t);
        setDisciplinas(d);
        setProfessores(p);
        setHorarios(h);
        if (s.length > 0) setSemestreId(s[0].id);
      })
      .catch((err) => setMensagem({ tipo: 'erro', texto: err?.message || 'Falha ao carregar dados.' }))
      .finally(() => setCarregando(false));
  }, []);

  const carregarAlocacoes = (id: number) => {
    if (!id) return;
    listarAlocacoesPorSemestre(id)
      .then(setAlocacoes)
      .catch((err) => setMensagem({ tipo: 'erro', texto: err?.message || 'Falha ao carregar grade.' }));
  };

  useEffect(() => { carregarAlocacoes(semestreId); }, [semestreId]);

  const nomeTurma = (id: number) => turmas.find((t) => t.id === id)?.nome ?? `Turma #${id}`;
  const nomeDisciplina = (id: number) => disciplinas.find((d) => d.id === id)?.nome ?? `Disciplina #${id}`;
  const nomeProfessor = (id: number | null) => (id ? professores.find((p) => p.id === id)?.nome ?? `Professor #${id}` : '—');

  const porTurma = useMemo(() => {
    const grupos: Record<number, AlocacaoUI[]> = {};
    for (const a of alocacoes) {
      const turmaId = a.oferta?.turma_id ?? -1;
      (grupos[turmaId] ??= []).push(a);
    }
    Object.values(grupos).forEach((lista) =>
      lista.sort((a, b) => (a.horario?.dia_semana ?? '').localeCompare(b.horario?.dia_semana ?? '') || (a.horario?.hora_inicio ?? '').localeCompare(b.horario?.hora_inicio ?? ''))
    );
    return grupos;
  }, [alocacoes]);

  const handleGerar = async () => {
    if (!semestreId) return;
    setGerando(true);
    setMensagem(null);
    try {
      const resultado = await gerarGrade(semestreId);
      setMensagem({ tipo: resultado.sucesso ? 'ok' : 'erro', texto: resultado.mensagem });
      if (resultado.sucesso) carregarAlocacoes(semestreId);
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: err?.message || 'Erro ao gerar grade.' });
    } finally {
      setGerando(false);
    }
  };

  const handleMover = async (alocacaoId: number) => {
    const novoHorarioId = moverSelecao[alocacaoId];
    if (!novoHorarioId) return;
    try {
      await moverAlocacao(alocacaoId, novoHorarioId);
      carregarAlocacoes(semestreId);
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: err?.message || 'Erro ao mover aula.' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Semestre:</label>
          <select
            value={semestreId}
            onChange={(e) => setSemestreId(Number(e.target.value))}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {semestres.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>
        <button
          onClick={handleGerar}
          disabled={gerando || !semestreId}
          className="px-4 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {gerando ? 'Gerando grade…' : 'Gerar Grade (Solver Z3)'}
        </button>
      </div>

      {mensagem && (
        <div className={`px-3 py-2 rounded-lg text-sm border ${mensagem.tipo === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
          {mensagem.texto}
        </div>
      )}

      {carregando ? (
        <p className="text-sm text-gray-400">Carregando…</p>
      ) : Object.keys(porTurma).length === 0 ? (
        <p className="text-sm text-gray-400">Nenhuma alocação para este semestre ainda. Gere a grade para começar.</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(porTurma).map(([turmaId, lista]) => (
            <div key={turmaId} className="bg-white border rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b font-medium text-sm text-gray-700">
                {nomeTurma(Number(turmaId))}
              </div>
              <table className="w-full text-sm">
                <thead className="text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="text-left px-4 py-2">Dia</th>
                    <th className="text-left px-4 py-2">Horário</th>
                    <th className="text-left px-4 py-2">Disciplina</th>
                    <th className="text-left px-4 py-2">Professor</th>
                    <th className="text-left px-4 py-2">Mover para</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lista.map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-2">{a.horario ? DIA_LABEL[a.horario.dia_semana] ?? a.horario.dia_semana : '—'}</td>
                      <td className="px-4 py-2">{a.horario ? `${a.horario.hora_inicio.slice(0, 5)}–${a.horario.hora_fim.slice(0, 5)}` : '—'}</td>
                      <td className="px-4 py-2">{a.oferta ? nomeDisciplina(a.oferta.disciplina_id) : '—'}</td>
                      <td className="px-4 py-2">{a.oferta ? nomeProfessor(a.oferta.professor_id) : '—'}</td>
                      <td className="px-4 py-2">
                        <select
                          value={moverSelecao[a.id] ?? 0}
                          onChange={(e) => setMoverSelecao((m) => ({ ...m, [a.id]: Number(e.target.value) }))}
                          className="border rounded-md px-2 py-1 text-xs"
                        >
                          <option value={0}>Selecionar horário…</option>
                          {horarios.map((h) => (
                            <option key={h.id} value={h.id}>
                              {DIA_LABEL[h.diaSemana] ?? h.diaSemana} {h.horaInicio.slice(0, 5)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleMover(a.id)}
                          disabled={!moverSelecao[a.id]}
                          className="text-xs font-medium text-[#1B4332] hover:underline disabled:text-gray-300"
                        >
                          Mover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
