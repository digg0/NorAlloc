import { useEffect, useMemo, useState } from 'react';
import { listarSemestres, type SemestreUI } from '../services/semestres';
import { listarTurmasBackend, type TurmaBackendUI } from '../services/turmasBackend';
import { listarDisciplinasBackend, type DisciplinaBackendUI } from '../services/disciplinasBackend';
import { listarProfessores, type ProfessorUI } from '../services/professores';
import { listarHorarios, type HorarioUI } from '../services/horarios';
import { gerarGrade, listarAlocacoesPorSemestre, moverAlocacao, type AlocacaoUI } from '../services/alocacoes';
import { DIAS_UTEIS, DIA_LABEL, LINHAS_GRADE_PADRAO } from '../services/gradeSlots';

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
  const [editando, setEditando] = useState<number | null>(null);
  const [novoHorarioId, setNovoHorarioId] = useState<number>(0);

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

  const nomeDisciplina = (id: number) => disciplinas.find((d) => d.id === id)?.nome ?? `Disciplina #${id}`;
  const nomeProfessor = (id: number | null) => (id ? professores.find((p) => p.id === id)?.nome ?? `Professor #${id}` : '—');

  const porTurma = useMemo(() => {
    const grupos: Record<number, AlocacaoUI[]> = {};
    for (const a of alocacoes) {
      const turmaId = a.oferta?.turma_id ?? -1;
      (grupos[turmaId] ??= []).push(a);
    }
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

  const iniciarMover = (alocacaoId: number) => {
    setEditando(alocacaoId);
    setNovoHorarioId(0);
  };

  const confirmarMover = async (alocacaoId: number) => {
    if (!novoHorarioId) return;
    try {
      await moverAlocacao(alocacaoId, novoHorarioId);
      setEditando(null);
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
      ) : turmas.length === 0 ? (
        <p className="text-sm text-gray-400">Nenhuma turma cadastrada.</p>
      ) : (
        <div className="space-y-6">
          {turmas.map((turma) => {
            const lista = porTurma[turma.id] ?? [];
            // mapa "HH:MM_DIA" -> alocação, para achar rapidamente a aula de cada célula
            const porCelula = new Map<string, AlocacaoUI>();
            for (const a of lista) {
              if (!a.horario) continue;
              const chave = `${a.horario.dia_semana}_${a.horario.hora_inicio.slice(0, 5)}`;
              porCelula.set(chave, a);
            }

            return (
              <div key={turma.id} className="bg-white border rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b font-medium text-sm text-gray-700">
                  {turma.nome} {lista.length === 0 && <span className="text-gray-400 font-normal">— sem alocações</span>}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="text-gray-500 uppercase">
                      <tr>
                        <th className="text-left px-3 py-2 w-28">Horário</th>
                        {DIAS_UTEIS.map((dia) => (
                          <th key={dia} className="text-center px-3 py-2">{DIA_LABEL[dia]}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {LINHAS_GRADE_PADRAO.map((linha, i) => {
                        if (linha.tipo === 'pausa') {
                          return (
                            <tr key={i} className="bg-gray-50/70">
                              <td colSpan={DIAS_UTEIS.length + 1} className="text-center px-3 py-1 text-gray-400 italic">
                                {linha.label} ({linha.horaInicio}–{linha.horaFim})
                              </td>
                            </tr>
                          );
                        }
                        return (
                          <tr key={i}>
                            <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{linha.horaInicio}–{linha.horaFim}</td>
                            {DIAS_UTEIS.map((dia) => {
                              const aloc = porCelula.get(`${dia}_${linha.horaInicio}`);
                              if (!aloc) return <td key={dia} className="px-2 py-2 text-center text-gray-300">—</td>;
                              const estaEditando = editando === aloc.id;
                              return (
                                <td key={dia} className="px-2 py-2 align-top">
                                  {estaEditando ? (
                                    <div className="flex flex-col gap-1 items-center">
                                      <select
                                        value={novoHorarioId}
                                        onChange={(e) => setNovoHorarioId(Number(e.target.value))}
                                        className="border rounded-md px-1 py-0.5 text-[11px] w-full"
                                      >
                                        <option value={0}>Novo horário…</option>
                                        {horarios.map((h) => (
                                          <option key={h.id} value={h.id}>
                                            {DIA_LABEL[h.diaSemana] ?? h.diaSemana} {h.horaInicio.slice(0, 5)}
                                          </option>
                                        ))}
                                      </select>
                                      <div className="flex gap-1">
                                        <button onClick={() => confirmarMover(aloc.id)} disabled={!novoHorarioId} className="text-[11px] text-emerald-600 font-medium disabled:text-gray-300">Mover</button>
                                        <button onClick={() => setEditando(null)} className="text-[11px] text-gray-400">Cancelar</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => iniciarMover(aloc.id)}
                                      title="Clique para mover esta aula"
                                      className="w-full text-left rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1.5 transition-colors"
                                    >
                                      <p className="font-medium text-emerald-900 leading-tight">{aloc.oferta ? nomeDisciplina(aloc.oferta.disciplina_id) : '—'}</p>
                                      <p className="text-emerald-600 leading-tight">{aloc.oferta ? nomeProfessor(aloc.oferta.professor_id) : ''}</p>
                                    </button>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
