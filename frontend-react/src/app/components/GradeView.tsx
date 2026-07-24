import { useEffect, useMemo, useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { listarSemestres, type SemestreUI } from '../services/semestres';
import { listarTurmasBackend, type TurmaBackendUI } from '../services/turmasBackend';
import { listarDisciplinasBackend, type DisciplinaBackendUI } from '../services/disciplinasBackend';
import { listarProfessores, type ProfessorUI } from '../services/professores';
import { listarHorarios, type HorarioUI } from '../services/horarios';
import {
  limparGrade, listarAlocacoesPorSemestre, moverAlocacao,
  gerarPropostas, aplicarProposta, validarSemestre,
  type AlocacaoUI, type PropostaItemUI, type AlertaUI,
} from '../services/alocacoes';
import { DIAS_UTEIS, DIA_LABEL, LINHAS_GRADE_PADRAO } from '../services/gradeSlots';

type Fase = 'idle' | 'gerando-propostas' | 'selecao' | 'aplicando' | 'edicao' | 'confirmado';

// ── Paleta de cores por disciplina ────────────────────────────────────────────
const DISC_PALETTE = [
  { bg: 'bg-sky-200',     text: 'text-sky-900',     sub: 'text-sky-700',    border: 'border-sky-300'    },
  { bg: 'bg-emerald-200', text: 'text-emerald-900', sub: 'text-emerald-700', border: 'border-emerald-300' },
  { bg: 'bg-amber-200',   text: 'text-amber-900',   sub: 'text-amber-700',  border: 'border-amber-300'  },
  { bg: 'bg-rose-200',    text: 'text-rose-900',    sub: 'text-rose-700',   border: 'border-rose-300'   },
  { bg: 'bg-violet-200',  text: 'text-violet-900',  sub: 'text-violet-700', border: 'border-violet-300' },
  { bg: 'bg-orange-200',  text: 'text-orange-900',  sub: 'text-orange-700', border: 'border-orange-300' },
  { bg: 'bg-teal-200',    text: 'text-teal-900',    sub: 'text-teal-700',   border: 'border-teal-300'   },
  { bg: 'bg-pink-200',    text: 'text-pink-900',    sub: 'text-pink-700',   border: 'border-pink-300'   },
  { bg: 'bg-lime-200',    text: 'text-lime-900',    sub: 'text-lime-700',   border: 'border-lime-300'   },
  { bg: 'bg-cyan-200',    text: 'text-cyan-900',    sub: 'text-cyan-700',   border: 'border-cyan-300'   },
];
const ALERTA_CELL = {
  bg: 'bg-amber-100', text: 'text-amber-900', sub: 'text-amber-700', border: 'border-amber-400',
};
function discColor(id: number) { return DISC_PALETTE[id % DISC_PALETTE.length]; }

const PROPOSTA_LABELS = [
  { titulo: 'Proposta A', subtitulo: 'Distribuição I'   },
  { titulo: 'Proposta B', subtitulo: 'Distribuição II'  },
  { titulo: 'Proposta C', subtitulo: 'Distribuição III' },
];

const ALERTA_INFO: Record<string, { label: string; cor: string }> = {
  CONFLITO_PROFESSOR:     { label: 'Conflito de Professor', cor: 'text-red-700 bg-red-50 border-red-200'       },
  CONFLITO_TURMA:         { label: 'Conflito de Turma',     cor: 'text-red-700 bg-red-50 border-red-200'       },
  PROFESSOR_AFASTADO:     { label: 'Prof. Afastado',        cor: 'text-amber-700 bg-amber-50 border-amber-200' },
  DISCIPLINA_SEM_HORARIO: { label: 'Sem Horário',           cor: 'text-amber-700 bg-amber-50 border-amber-200' },
  SOBRECARGA:             { label: 'Sobrecarga',            cor: 'text-orange-700 bg-orange-50 border-orange-200' },
  JANELA:                 { label: 'Janela entre Aulas',    cor: 'text-blue-700 bg-blue-50 border-blue-200'    },
};

// ── Drag-and-drop ─────────────────────────────────────────────────────────────
const DRAG_TYPE = 'AULA_GRADE';
interface DragItem { alocId: number; }

function CelulaDrag({ alocId, children }: { alocId: number; children: React.ReactNode }) {
  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: DRAG_TYPE,
    item: { alocId },
    collect: (m) => ({ isDragging: m.isDragging() }),
  });
  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.35 : 1, cursor: 'grab' }} className="w-full h-full">
      {children}
    </div>
  );
}

function CelulaDropzone({
  horarioId, isEmpty, onDrop, children,
}: {
  horarioId: number | undefined;
  isEmpty: boolean;
  onDrop: (alocId: number, hId: number) => void;
  children?: React.ReactNode;
}) {
  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: DRAG_TYPE,
    canDrop: () => horarioId !== undefined,
    drop: (item) => { if (horarioId !== undefined) onDrop(item.alocId, horarioId); },
    collect: (m) => ({ isOver: m.isOver(), canDrop: m.canDrop() }),
  });
  const highlight = isOver && canDrop;
  return (
    <div
      ref={drop}
      className={`min-h-[44px] rounded-md transition-all ${
        highlight
          ? 'ring-2 ring-[#1B4332] ring-inset bg-emerald-50'
          : isEmpty
          ? 'border border-dashed border-gray-200 bg-gray-50'
          : ''
      }`}
    >
      {children}
    </div>
  );
}

// ── Interface mínima compartilhada ────────────────────────────────────────────
interface ItemMinimo {
  oferta: { disciplina_id: number; professor_id: number | null; turma_id: number } | null;
  horario: { dia_semana: string; hora_inicio: string } | null;
}

// ── Célula de aula (apenas visual) ────────────────────────────────────────────
function CelulaAula({
  disciplinaId, disciplinaNome, professorNome, temAlerta,
}: {
  disciplinaId: number; disciplinaNome: string; professorNome: string; temAlerta: boolean;
}) {
  const c = temAlerta ? ALERTA_CELL : discColor(disciplinaId);
  return (
    <div className={`w-full h-full min-h-[44px] text-left rounded-md border px-2 py-2 select-none ${c.bg} ${c.border}`}>
      <p className={`font-semibold text-[11px] leading-tight ${c.text}`}>{disciplinaNome}</p>
      <p className={`text-[10px] leading-tight mt-0.5 ${c.sub}`}>({professorNome})</p>
      {temAlerta && <span className="text-[9px] text-amber-600 font-bold block mt-0.5">⚠</span>}
    </div>
  );
}

// ── Cabeçalho de tabela (compartilhado) ───────────────────────────────────────
function CabecalhoTabela({ turma, info, acoes }: {
  turma: TurmaBackendUI;
  info: string;
  acoes?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[#1B4332]">
      <div>
        <p className="text-[10px] font-semibold tracking-widest uppercase text-white/60">Quadro de Horários</p>
        <p className="text-sm font-bold text-white">{turma.nome}</p>
      </div>
      <div className="flex items-center gap-2">
        {acoes}
        <span className="text-[11px] text-white/50">{info}</span>
      </div>
    </div>
  );
}

function LinhaHorario({ horaInicio, horaFim }: { horaInicio: string; horaFim: string }) {
  return (
    <td className="px-3 py-1.5 text-gray-400 whitespace-nowrap font-mono text-[10px] border-r border-gray-100 bg-gray-50/40">
      {horaInicio}<br /><span className="text-gray-300">{horaFim}</span>
    </td>
  );
}

// ── Tabela leitura (propostas + idle) ─────────────────────────────────────────
function TabelaLeitura({
  turma, itens, disciplinas, professores,
}: {
  turma: TurmaBackendUI; itens: ItemMinimo[];
  disciplinas: DisciplinaBackendUI[]; professores: ProfessorUI[];
}) {
  const nomeDisciplina = (id: number) => disciplinas.find((d) => d.id === id)?.nome ?? `Disc. #${id}`;
  const nomeProfessor  = (id: number | null) => id ? (professores.find((p) => p.id === id)?.nome ?? `Prof. #${id}`) : '—';

  const porCelula = useMemo(() => {
    const m = new Map<string, ItemMinimo>();
    for (const item of itens) {
      if (!item.horario) continue;
      m.set(`${item.horario.dia_semana}_${item.horario.hora_inicio.slice(0, 5)}`, item);
    }
    return m;
  }, [itens]);

  return (
    <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200">
      <CabecalhoTabela turma={turma} info={`${itens.length} aulas`} />
      <div className="overflow-x-auto bg-white">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="text-left px-3 py-2 text-gray-500 font-semibold uppercase tracking-wider text-[10px] w-24 border-r border-gray-200">Horário</th>
              {DIAS_UTEIS.map((d) => (
                <th key={d} className="text-center px-2 py-2 text-gray-700 font-bold uppercase tracking-wider text-[11px]">{DIA_LABEL[d]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LINHAS_GRADE_PADRAO.map((linha, i) => {
              if (linha.tipo === 'pausa') {
                return (
                  <tr key={i} className="bg-gray-50 border-y border-dashed border-gray-200">
                    <td colSpan={DIAS_UTEIS.length + 1} className="px-3 py-1 text-[10px] text-gray-400 italic font-medium tracking-wide">
                      — {linha.label} · {linha.horaInicio}–{linha.horaFim} —
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={i} className="border-b border-gray-100">
                  <LinhaHorario horaInicio={linha.horaInicio} horaFim={linha.horaFim} />
                  {DIAS_UTEIS.map((dia) => {
                    const item = porCelula.get(`${dia}_${linha.horaInicio}`);
                    return (
                      <td key={dia} className="px-1.5 py-1.5 border-r border-gray-100 last:border-r-0">
                        {item ? (
                          <CelulaAula
                            disciplinaId={item.oferta?.disciplina_id ?? 0}
                            disciplinaNome={item.oferta ? nomeDisciplina(item.oferta.disciplina_id) : '—'}
                            professorNome={item.oferta ? nomeProfessor(item.oferta.professor_id) : '—'}
                            temAlerta={false}
                          />
                        ) : (
                          <div className="min-h-[44px] rounded-md bg-gray-50 border border-dashed border-gray-200" />
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
}

// ── Tabela editável com drag-and-drop ─────────────────────────────────────────
function TabelaEdicao({
  turma, alocacoes, disciplinas, professores, horarios,
  alertasTurma, alertasProf, onMover,
}: {
  turma: TurmaBackendUI; alocacoes: AlocacaoUI[];
  disciplinas: DisciplinaBackendUI[]; professores: ProfessorUI[]; horarios: HorarioUI[];
  alertasTurma: Set<number>; alertasProf: Set<number>;
  onMover: (alocId: number, novoHorarioId: number) => void;
}) {
  const nomeDisciplina = (id: number) => disciplinas.find((d) => d.id === id)?.nome ?? `Disc. #${id}`;
  const nomeProfessor  = (id: number | null) => id ? (professores.find((p) => p.id === id)?.nome ?? `Prof. #${id}`) : '—';

  // Mapa de slot → horario_id (para saber qual id usar no drop)
  const horarioMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const h of horarios) {
      m.set(`${h.diaSemana}_${h.horaInicio.slice(0, 5)}`, h.id);
    }
    return m;
  }, [horarios]);

  const porCelula = useMemo(() => {
    const m = new Map<string, AlocacaoUI>();
    for (const a of alocacoes) {
      if (!a.horario) continue;
      m.set(`${a.horario.dia_semana}_${a.horario.hora_inicio.slice(0, 5)}`, a);
    }
    return m;
  }, [alocacoes]);

  const turmaComAlerta = alertasTurma.has(turma.id);

  return (
    <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200">
      <div className={`flex items-center justify-between px-4 py-3 ${turmaComAlerta ? 'bg-amber-600' : 'bg-[#1B4332]'}`}>
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-white/60">Quadro de Horários · Editável</p>
          <p className="text-sm font-bold text-white">{turma.nome}</p>
        </div>
        <div className="flex items-center gap-2">
          {turmaComAlerta && (
            <span className="text-[11px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">⚠ alerta</span>
          )}
          <span className="text-[11px] text-white/50">{alocacoes.length} aulas</span>
        </div>
      </div>
      <div className="overflow-x-auto bg-white">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="text-left px-3 py-2 text-gray-500 font-semibold uppercase tracking-wider text-[10px] w-24 border-r border-gray-200">Horário</th>
              {DIAS_UTEIS.map((d) => (
                <th key={d} className="text-center px-2 py-2 text-gray-700 font-bold uppercase tracking-wider text-[11px]">{DIA_LABEL[d]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LINHAS_GRADE_PADRAO.map((linha, i) => {
              if (linha.tipo === 'pausa') {
                return (
                  <tr key={i} className="bg-gray-50 border-y border-dashed border-gray-200">
                    <td colSpan={DIAS_UTEIS.length + 1} className="px-3 py-1 text-[10px] text-gray-400 italic font-medium tracking-wide">
                      — {linha.label} · {linha.horaInicio}–{linha.horaFim} —
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={i} className="border-b border-gray-100">
                  <LinhaHorario horaInicio={linha.horaInicio} horaFim={linha.horaFim} />
                  {DIAS_UTEIS.map((dia) => {
                    const aloc         = porCelula.get(`${dia}_${linha.horaInicio}`);
                    const horarioId    = horarioMap.get(`${dia}_${linha.horaInicio}`);
                    const profId       = aloc?.oferta?.professor_id ?? null;
                    const temAlerta    = !!aloc && (
                      alertasTurma.has(turma.id) ||
                      (profId !== null && alertasProf.has(profId))
                    );

                    return (
                      <td key={dia} className="px-1.5 py-1.5 border-r border-gray-100 last:border-r-0 align-top">
                        <CelulaDropzone horarioId={horarioId} isEmpty={!aloc} onDrop={onMover}>
                          {aloc && (
                            <CelulaDrag alocId={aloc.id}>
                              <CelulaAula
                                disciplinaId={aloc.oferta?.disciplina_id ?? 0}
                                disciplinaNome={aloc.oferta ? nomeDisciplina(aloc.oferta.disciplina_id) : '—'}
                                professorNome={aloc.oferta ? nomeProfessor(profId) : '—'}
                                temAlerta={temAlerta}
                              />
                            </CelulaDrag>
                          )}
                        </CelulaDropzone>
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
}

// ── Painel de alertas ─────────────────────────────────────────────────────────
function PainelAlertas({ alertas, aberto, onToggle }: { alertas: AlertaUI[]; aberto: boolean; onToggle: () => void }) {
  const erros  = alertas.filter((a) => ['CONFLITO_PROFESSOR', 'CONFLITO_TURMA'].includes(a.tipo));
  const avisos = alertas.filter((a) => !['CONFLITO_PROFESSOR', 'CONFLITO_TURMA'].includes(a.tipo));
  const total  = alertas.length;
  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-sm text-gray-800">Alertas da Grade</span>
          {total > 0 ? (
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${erros.length > 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
              {total} {total === 1 ? 'alerta' : 'alertas'}
            </span>
          ) : (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">✓ Sem conflitos</span>
          )}
        </div>
        <span className="text-gray-400 text-sm">{aberto ? '▲' : '▼'}</span>
      </button>
      {aberto && (
        <div className="border-t p-3 space-y-1.5 max-h-56 overflow-y-auto bg-gray-50/60">
          {total === 0 ? (
            <p className="text-sm text-emerald-700 text-center py-3 font-medium">Nenhum alerta encontrado.</p>
          ) : (
            [...erros, ...avisos].map((a, i) => {
              const info = ALERTA_INFO[a.tipo] ?? { label: a.tipo, cor: 'text-gray-700 bg-gray-50 border-gray-200' };
              return (
                <div key={i} className={`px-3 py-2 border rounded-lg text-xs flex gap-2 ${info.cor}`}>
                  <span className="font-bold shrink-0">{info.label}</span>
                  <span className="flex-1">{a.descricao}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export function GradeView() {
  const [semestres,   setSemestres]   = useState<SemestreUI[]>([]);
  const [turmas,      setTurmas]      = useState<TurmaBackendUI[]>([]);
  const [disciplinas, setDisciplinas] = useState<DisciplinaBackendUI[]>([]);
  const [professores, setProfessores] = useState<ProfessorUI[]>([]);
  const [horarios,    setHorarios]    = useState<HorarioUI[]>([]);
  const [alocacoes,   setAlocacoes]   = useState<AlocacaoUI[]>([]);

  const [semestreId, setSemestreId] = useState<number>(0);
  const [carregando, setCarregando] = useState(true);
  const [mensagem,   setMensagem]   = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [limpando,   setLimpando]   = useState(false);

  const [fase,           setFase]           = useState<Fase>('idle');
  const [propostas,      setPropostas]      = useState<PropostaItemUI[][]>([]);
  const [abaAtiva,       setAbaAtiva]       = useState(0);
  const [alertas,        setAlertas]        = useState<AlertaUI[]>([]);
  const [alertasAbertos, setAlertasAbertos] = useState(true);

  useEffect(() => {
    Promise.all([listarSemestres(), listarTurmasBackend(), listarDisciplinasBackend(), listarProfessores(), listarHorarios()])
      .then(([s, t, d, p, h]) => {
        setSemestres(s); setTurmas(t); setDisciplinas(d); setProfessores(p); setHorarios(h);
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

  const alertasPorProfessor = useMemo(
    () => new Set(alertas.filter((a) => a.entidadeTipo === 'professor').map((a) => a.entidadeId)),
    [alertas]
  );
  const alertasPorTurma = useMemo(
    () => new Set(alertas.filter((a) => a.entidadeTipo === 'turma').map((a) => a.entidadeId)),
    [alertas]
  );

  const porTurma = useMemo(() => {
    const g: Record<number, AlocacaoUI[]> = {};
    for (const a of alocacoes) { const tid = a.oferta?.turma_id ?? -1; (g[tid] ??= []).push(a); }
    return g;
  }, [alocacoes]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleGerarPropostas = async () => {
    if (!semestreId) return;
    setFase('gerando-propostas'); setMensagem(null);
    try {
      const props = await gerarPropostas(semestreId);
      setPropostas(props); setAbaAtiva(0); setFase('selecao');
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: err?.message || 'Erro ao gerar propostas.' });
      setFase('idle');
    }
  };

  const handleUsarProposta = async (idx: number) => {
    const proposta = propostas[idx];
    if (!proposta) return;
    setFase('aplicando');
    try {
      await aplicarProposta(semestreId, proposta.map((p) => ({ oferta_id: p.ofertaId, horario_id: p.horarioId })));
      carregarAlocacoes(semestreId);
      setAlertas(await validarSemestre(semestreId));
      setAlertasAbertos(true); setFase('edicao');
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: err?.message || 'Erro ao aplicar proposta.' });
      setFase('selecao');
    }
  };

  const handleLimpar = async () => {
    if (!semestreId || !window.confirm('Limpar toda a grade deste semestre?')) return;
    setLimpando(true); setMensagem(null);
    try {
      const removidas = await limparGrade(semestreId);
      setMensagem({ tipo: 'ok', texto: `Grade limpa: ${removidas} alocação(ões) removida(s).` });
      setAlertas([]); setFase('idle'); carregarAlocacoes(semestreId);
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: err?.message || 'Erro ao limpar grade.' });
    } finally { setLimpando(false); }
  };

  const handleMover = async (alocId: number, novoHorarioId: number) => {
    try {
      await moverAlocacao(alocId, novoHorarioId);
      carregarAlocacoes(semestreId);
      setAlertas(await validarSemestre(semestreId));
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: err?.message || 'Erro ao mover aula.' });
    }
  };

  const handleConfirmar = () => {
    if (!window.confirm('Confirmar a grade atual? Esta ação sinaliza que a grade foi aprovada pelo coordenador.')) return;
    setFase('confirmado');
    setMensagem(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (carregando) return <p className="text-sm text-gray-400 py-8 text-center">Carregando…</p>;

  if (fase === 'gerando-propostas' || fase === 'aplicando') {
    const mensagemSpinner =
      fase === 'gerando-propostas' ? 'Executando Z3 — gerando 3 propostas de grade…' :
                                     'Aplicando proposta selecionada…';
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-5">
        <div className="w-12 h-12 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-700 font-semibold">{mensagemSpinner}</p>
        {fase === 'gerando-propostas' && (
          <p className="text-xs text-gray-400 max-w-xs text-center">
            O Z3 avalia todas as preferências e restrições dos professores para gerar 3 distribuições distintas.
          </p>
        )}
      </div>
    );
  }

  if (fase === 'selecao') {
    const proposta = propostas[abaAtiva] ?? [];
    const meta     = PROPOSTA_LABELS[abaAtiva];
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-800">Selecione uma Proposta de Grade</h3>
            <p className="text-xs text-gray-500 mt-0.5">Compare as 3 distribuições e clique em "Usar esta Proposta".</p>
          </div>
          <button onClick={() => setFase('idle')} className="text-xs text-gray-500 border rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
            ← Cancelar
          </button>
        </div>
        <div className="flex gap-1 border-b">
          {PROPOSTA_LABELS.map((lbl, idx) => (
            <button
              key={idx}
              onClick={() => setAbaAtiva(idx)}
              className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
                abaAtiva === idx ? 'border-[#1B4332] text-[#1B4332] bg-emerald-50/60' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {lbl.titulo}
            </button>
          ))}
        </div>
        <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-bold text-gray-800">{meta.titulo} — {meta.subtitulo}</p>
              <p className="text-xs text-gray-500 mt-0.5">{proposta.length} alocação(ões) · {turmas.length} turma(s)</p>
            </div>
            <button
              onClick={() => handleUsarProposta(abaAtiva)}
              className="px-5 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
              Usar esta Proposta →
            </button>
          </div>
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {proposta.length === 0 ? (
              <div className="py-6 text-center text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg">
                Nenhuma alocação gerada. Verifique as disponibilidades e ofertas.
              </div>
            ) : (
              turmas.map((turma) => (
                <TabelaLeitura
                  key={turma.id}
                  turma={turma}
                  itens={proposta.filter((p) => p.oferta?.turma_id === turma.id)}
                  disciplinas={disciplinas}
                  professores={professores}
                />
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  if (fase === 'confirmado') {
    const alertasErros = alertas.filter((a) => ['CONFLITO_PROFESSOR', 'CONFLITO_TURMA'].includes(a.tipo));
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center">
          <span className="text-2xl text-emerald-700 font-bold select-none">✓</span>
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-bold text-gray-800">Grade Confirmada</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            A grade do semestre foi aprovada pelo coordenador e está pronta para publicação.
          </p>
          {alertasErros.length > 0 && (
            <p className="text-xs text-amber-700 font-medium bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mt-2">
              Atenção: {alertasErros.length} conflito(s) ainda pendente(s) na grade.
            </p>
          )}
        </div>
        <button
          onClick={() => setFase('edicao')}
          className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
        >
          ← Voltar à Edição
        </button>
      </div>
    );
  }

  // idle + edicao
  const modoEdicao   = fase === 'edicao';
  const semestreNome = semestres.find((s) => s.id === semestreId)?.nome ?? '';

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 font-medium">Semestre:</label>
          <select
            value={semestreId}
            onChange={(e) => { setSemestreId(Number(e.target.value)); setFase('idle'); setAlertas([]); }}
            className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
          >
            {semestres.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {modoEdicao && (
            <button
              onClick={() => propostas.length > 0 ? setFase('selecao') : setFase('idle')}
              className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              ← Voltar
            </button>
          )}
          {!modoEdicao && alocacoes.length > 0 && (
            <button
              onClick={async () => {
                setFase('edicao');
                setAlertas(await validarSemestre(semestreId).catch(() => []));
                setAlertasAbertos(true);
              }}
              className="px-4 py-2 bg-white border border-[#1B4332]/40 hover:bg-emerald-50 text-[#1B4332] text-sm font-medium rounded-lg transition-colors"
            >
              Editar Grade Atual
            </button>
          )}
          <button
            onClick={handleLimpar}
            disabled={limpando || !semestreId}
            className="px-4 py-2 bg-white border border-red-200 hover:bg-red-50 disabled:opacity-40 text-red-600 text-sm font-medium rounded-lg transition-colors"
          >
            {limpando ? 'Limpando…' : 'Limpar Grade'}
          </button>
          {modoEdicao && (
            <button
              onClick={handleConfirmar}
              className="px-4 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
              Confirmar Grade ✓
            </button>
          )}
          <button
            onClick={handleGerarPropostas}
            disabled={!semestreId}
            className="px-4 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            Gerar Grade (3 Propostas)
          </button>
        </div>
      </div>

      {mensagem && (
        <div className={`px-4 py-2.5 rounded-lg text-sm border font-medium ${mensagem.tipo === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
          {mensagem.texto}
        </div>
      )}

      {modoEdicao && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[#1B4332]/5 border border-[#1B4332]/20 rounded-lg text-sm text-[#1B4332]">
          <span className="w-2 h-2 rounded-full bg-[#1B4332] animate-pulse" />
          <span className="font-semibold">Modo de edição ativo</span>
          <span className="text-[#1B4332]/50">— arraste e solte as aulas para reorganizar</span>
        </div>
      )}

      {modoEdicao && (
        <PainelAlertas alertas={alertas} aberto={alertasAbertos} onToggle={() => setAlertasAbertos((v) => !v)} />
      )}

      {alocacoes.length > 0 && (
        <p className="text-center text-[11px] font-semibold tracking-widest uppercase text-gray-400">
          Grade Horária · {semestreNome}
        </p>
      )}

      {turmas.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Nenhuma turma cadastrada.</p>
      ) : modoEdicao ? (
        <DndProvider backend={HTML5Backend}>
          <div className="space-y-6">
            {turmas.map((turma) => (
              <TabelaEdicao
                key={turma.id}
                turma={turma}
                alocacoes={porTurma[turma.id] ?? []}
                disciplinas={disciplinas}
                professores={professores}
                horarios={horarios}
                alertasTurma={alertasPorTurma}
                alertasProf={alertasPorProfessor}
                onMover={handleMover}
              />
            ))}
          </div>
        </DndProvider>
      ) : (
        <div className="space-y-6">
          {turmas.map((turma) => (
            <TabelaLeitura
              key={turma.id}
              turma={turma}
              itens={porTurma[turma.id] ?? []}
              disciplinas={disciplinas}
              professores={professores}
            />
          ))}
        </div>
      )}
    </div>
  );
}
