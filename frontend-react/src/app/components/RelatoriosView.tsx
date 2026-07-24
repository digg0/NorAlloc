import { useEffect, useMemo, useState } from 'react';
import { listarCursos, type CursoUI } from '../services/cursos';
import { listarSemestres, type SemestreUI } from '../services/semestres';
import { getRelatorio, baixarRelatorioPdf, type RelatorioUI, type AulaGradeUI, type TurmaRelatorioUI } from '../services/relatorios';
import { DIAS_UTEIS, DIA_LABEL, LINHAS_GRADE_PADRAO } from '../services/gradeSlots';

// ── Paleta de cores por nome de disciplina ────────────────────────────────────
const DISC_PALETTE = [
  { bg: '#BFDBFE', text: '#1E3A5F', sub: '#2563EB', border: '#93C5FD' }, // sky
  { bg: '#A7F3D0', text: '#064E3B', sub: '#059669', border: '#6EE7B7' }, // emerald
  { bg: '#FDE68A', text: '#78350F', sub: '#D97706', border: '#FCD34D' }, // amber
  { bg: '#FECACA', text: '#7F1D1D', sub: '#DC2626', border: '#FCA5A5' }, // rose
  { bg: '#DDD6FE', text: '#3B0764', sub: '#7C3AED', border: '#C4B5FD' }, // violet
  { bg: '#FED7AA', text: '#7C2D12', sub: '#EA580C', border: '#FDBA74' }, // orange
  { bg: '#99F6E4', text: '#134E4A', sub: '#0D9488', border: '#5EEAD4' }, // teal
  { bg: '#FBCFE8', text: '#831843', sub: '#DB2777', border: '#F9A8D4' }, // pink
  { bg: '#D9F99D', text: '#365314', sub: '#65A30D', border: '#BEF264' }, // lime
  { bg: '#A5F3FC', text: '#164E63', sub: '#0891B2', border: '#67E8F9' }, // cyan
];

function hashNome(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 31) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function discColor(nome: string) { return DISC_PALETTE[hashNome(nome) % DISC_PALETTE.length]; }

// Mapeia o label português do backend → chave DIAS_UTEIS para indexar na grade
const LABEL_TO_DIA: Record<string, string> = {
  'Segunda-feira': 'SEGUNDA',
  'Terça-feira':   'TERCA',
  'Quarta-feira':  'QUARTA',
  'Quinta-feira':  'QUINTA',
  'Sexta-feira':   'SEXTA',
  'Sábado':        'SABADO',
};

interface RelatoriosViewProps {
  cursoFixo?: { id: number; nome: string } | null;
}

// ── Grade visual de uma turma ─────────────────────────────────────────────────
function TabelaGradeRelatorio({
  turma, curso, semestre,
}: {
  turma: TurmaRelatorioUI; curso: string; semestre: string;
}) {
  const porCelula = useMemo(() => {
    const m = new Map<string, AulaGradeUI>();
    for (const item of turma.grade) {
      const diaKey = LABEL_TO_DIA[item.dia] ?? item.dia.toUpperCase();
      m.set(`${diaKey}_${item.horario}`, item);
    }
    return m;
  }, [turma.grade]);

  // Legenda de cores: uma entrada por disciplina única
  const legendaDiscs = useMemo(() => {
    const nomes = [...new Set(turma.grade.map((a) => a.disciplina))].sort();
    return nomes.map((nome) => ({ nome, cor: discColor(nome) }));
  }, [turma.grade]);

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      {/* Cabeçalho */}
      <div style={{ backgroundColor: '#1B4332' }} className="px-5 py-4">
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Quadro de Horários · {semestre}
        </p>
        <p style={{ color: '#fff', fontSize: 15, fontWeight: 800, marginTop: 2 }}>{turma.nome}</p>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 1 }}>{curso}</p>
      </div>

      {/* Grade */}
      <div className="overflow-x-auto bg-white">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ backgroundColor: '#F3F4F6', borderBottom: '2px solid #E5E7EB' }}>
              <th style={{ textAlign: 'left', padding: '6px 12px', color: '#6B7280', fontWeight: 700, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', width: 90, borderRight: '1px solid #E5E7EB' }}>
                Horário
              </th>
              {DIAS_UTEIS.map((d) => (
                <th key={d} style={{ textAlign: 'center', padding: '6px 8px', color: '#374151', fontWeight: 800, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {DIA_LABEL[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LINHAS_GRADE_PADRAO.map((linha, i) => {
              if (linha.tipo === 'pausa') {
                return (
                  <tr key={i} style={{ backgroundColor: '#F9FAFB', borderTop: '1px dashed #E5E7EB', borderBottom: '1px dashed #E5E7EB' }}>
                    <td colSpan={DIAS_UTEIS.length + 1} style={{ padding: '4px 12px', fontSize: 10, color: '#9CA3AF', fontStyle: 'italic', fontWeight: 600, letterSpacing: '0.05em' }}>
                      — {linha.label} · {linha.horaInicio}–{linha.horaFim} —
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '4px 12px', color: '#9CA3AF', fontFamily: 'monospace', fontSize: 10, whiteSpace: 'nowrap', borderRight: '1px solid #F3F4F6', backgroundColor: 'rgba(249,250,251,0.4)' }}>
                    {linha.horaInicio}<br />
                    <span style={{ color: '#D1D5DB' }}>{linha.horaFim}</span>
                  </td>
                  {DIAS_UTEIS.map((dia) => {
                    const aula = porCelula.get(`${dia}_${linha.horaInicio}`);
                    if (!aula) {
                      return (
                        <td key={dia} style={{ padding: '4px 6px', borderRight: '1px solid #F3F4F6' }}>
                          <div style={{ minHeight: 48, borderRadius: 6, border: '1.5px dashed #E5E7EB', backgroundColor: '#F9FAFB' }} />
                        </td>
                      );
                    }
                    const c = discColor(aula.disciplina);
                    return (
                      <td key={dia} style={{ padding: '4px 6px', borderRight: '1px solid #F3F4F6', verticalAlign: 'top' }}>
                        <div style={{
                          minHeight: 48, borderRadius: 6, border: `1.5px solid ${c.border}`,
                          backgroundColor: c.bg, padding: '6px 8px',
                        }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 11, color: c.text, lineHeight: 1.3 }}>{aula.disciplina}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 10, color: c.sub, lineHeight: 1.2 }}>({aula.professor})</p>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legenda de disciplinas */}
      {legendaDiscs.length > 0 && (
        <div style={{ borderTop: '1px solid #E5E7EB', padding: '10px 14px', backgroundColor: '#FAFAFA', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {legendaDiscs.map(({ nome, cor }) => (
            <span key={nome} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600,
              backgroundColor: cor.bg, border: `1px solid ${cor.border}`, color: cor.text,
              borderRadius: 99, padding: '2px 10px',
            }}>
              {nome}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export function RelatoriosView({ cursoFixo }: RelatoriosViewProps) {
  const [cursos,     setCursos]     = useState<CursoUI[]>([]);
  const [semestres,  setSemestres]  = useState<SemestreUI[]>([]);
  const [cursoId,    setCursoId]    = useState<number>(0);
  const [semestreId, setSemestreId] = useState<number>(0);
  const [relatorio,  setRelatorio]  = useState<RelatorioUI | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [erro,       setErro]       = useState('');

  useEffect(() => {
    if (cursoFixo) {
      setCursoId(cursoFixo.id);
      listarSemestres()
        .then((s) => { setSemestres(s); if (s.length > 0) setSemestreId(s[0].id); })
        .catch((err) => setErro(err?.message || 'Falha ao carregar semestres.'));
      return;
    }
    Promise.all([listarCursos(), listarSemestres()])
      .then(([c, s]) => {
        setCursos(c); setSemestres(s);
        if (c.length > 0) setCursoId(c[0].id);
        if (s.length > 0) setSemestreId(s[0].id);
      })
      .catch((err) => setErro(err?.message || 'Falha ao carregar cursos/semestres.'));
  }, [cursoFixo]);

  useEffect(() => {
    if (!cursoId || !semestreId) return;
    setCarregando(true); setErro('');
    getRelatorio(cursoId, semestreId)
      .then(setRelatorio)
      .catch((err) => { setErro(err?.message || 'Falha ao emitir relatório.'); setRelatorio(null); })
      .finally(() => setCarregando(false));
  }, [cursoId, semestreId]);

  const exportarPdf = async () => {
    if (!cursoId || !semestreId) return;
    setExportando(true);
    try { await baixarRelatorioPdf(cursoId, semestreId); }
    catch (err: any) { setErro(err?.message || 'Erro ao exportar PDF.'); }
    finally { setExportando(false); }
  };

  return (
    <div className="space-y-4">
        {/* Controles — ocultos na impressão */}
        <div className="no-print flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm text-gray-600">Curso:</label>
            {cursoFixo ? (
              <p className="border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-600">{cursoFixo.nome}</p>
            ) : (
              <select value={cursoId} onChange={(e) => setCursoId(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm">
                {cursos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            )}
            <label className="text-sm text-gray-600">Semestre:</label>
            <select value={semestreId} onChange={(e) => setSemestreId(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm">
              {semestres.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </div>
          <button
            onClick={exportarPdf}
            disabled={exportando || !relatorio}
            className="px-4 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {exportando ? 'Exportando…' : 'Exportar PDF'}
          </button>
        </div>

        {erro && <div className="no-print px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{erro}</div>}

        {carregando ? (
          <p className="no-print text-sm text-gray-400 py-8 text-center">Carregando relatório…</p>
        ) : relatorio ? (
          <div className="space-y-6">
            {/* Resumo */}
            <div className="bg-white border rounded-xl p-4">
              <h3 className="font-bold text-gray-900 text-base">{relatorio.curso} — {relatorio.semestre}</h3>
              {relatorio.coordenador && <p className="text-sm text-gray-500 mt-0.5">Coordenador(a): {relatorio.coordenador}</p>}
              <div className="grid grid-cols-4 gap-3 mt-3">
                {([
                  ['Turmas', relatorio.resumo.turmas],
                  ['Disciplinas', relatorio.resumo.disciplinas],
                  ['Professores', relatorio.resumo.professores],
                  ['Carga Total (h)', relatorio.resumo.cargaTotal],
                ] as [string, number][]).map(([label, valor]) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-gray-900">{valor}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Grade por turma */}
            {relatorio.turmas.map((t, idx) => (
              <div key={t.nome}>
                {t.grade.length === 0 ? (
                  <div className="no-print bg-white border rounded-xl px-5 py-4">
                    <p className="font-semibold text-gray-700">{t.nome}</p>
                    <p className="text-sm text-gray-400 mt-1">Sem alocações nesta turma.</p>
                  </div>
                ) : (
                  <TabelaGradeRelatorio turma={t} curso={relatorio.curso} semestre={relatorio.semestre} />
                )}
              </div>
            ))}

            {/* Alertas */}
            <div className="bg-white border rounded-xl p-4">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">
                Alertas
                {relatorio.alertas.length > 0 && (
                  <span className="ml-2 text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                    {relatorio.alertas.length}
                  </span>
                )}
              </h4>
              {relatorio.alertas.length === 0 ? (
                <p className="text-sm text-emerald-600 font-medium">✓ Nenhum alerta encontrado.</p>
              ) : (
                <ul className="space-y-1.5">
                  {relatorio.alertas.map((a, i) => (
                    <li key={i} className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                      <span className="font-bold">[{a.tipo}]</span> {a.descricao}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Listas de professores e disciplinas */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { titulo: 'Professores Envolvidos', items: relatorio.professoresEnvolvidos },
                { titulo: 'Disciplinas Ofertadas',  items: relatorio.disciplinasOfertadas  },
              ].map(({ titulo, items }) => (
                <div key={titulo} className="bg-white border rounded-xl p-4">
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">{titulo}</h4>
                  {items.length === 0 ? (
                    <p className="text-sm text-gray-400">—</p>
                  ) : (
                    <ul className="space-y-0.5">
                      {items.map((nome) => (
                        <li key={nome} className="text-sm text-gray-600 py-0.5 border-b border-gray-50 last:border-0">{nome}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">Selecione um curso e semestre para emitir o relatório.</p>
        )}
    </div>
  );
}
