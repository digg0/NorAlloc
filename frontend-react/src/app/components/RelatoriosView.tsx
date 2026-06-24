import { useEffect, useState } from 'react';
import { listarCursos, type CursoUI } from '../services/cursos';
import { listarSemestres, type SemestreUI } from '../services/semestres';
import { getRelatorio, baixarRelatorioPdf, type RelatorioUI } from '../services/relatorios';

interface RelatoriosViewProps {
  /** Quando informado (coordenador), trava o relatório no próprio curso. */
  cursoFixo?: { id: number; nome: string } | null;
}

export function RelatoriosView({ cursoFixo }: RelatoriosViewProps) {
  const [cursos, setCursos] = useState<CursoUI[]>([]);
  const [semestres, setSemestres] = useState<SemestreUI[]>([]);
  const [cursoId, setCursoId] = useState<number>(0);
  const [semestreId, setSemestreId] = useState<number>(0);
  const [relatorio, setRelatorio] = useState<RelatorioUI | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [erro, setErro] = useState('');

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
        setCursos(c);
        setSemestres(s);
        if (c.length > 0) setCursoId(c[0].id);
        if (s.length > 0) setSemestreId(s[0].id);
      })
      .catch((err) => setErro(err?.message || 'Falha ao carregar cursos/semestres.'));
  }, [cursoFixo]);

  const buscar = () => {
    if (!cursoId || !semestreId) return;
    setCarregando(true);
    setErro('');
    getRelatorio(cursoId, semestreId)
      .then(setRelatorio)
      .catch((err) => { setErro(err?.message || 'Falha ao emitir relatório.'); setRelatorio(null); })
      .finally(() => setCarregando(false));
  };

  useEffect(() => { if (cursoId && semestreId) buscar(); }, [cursoId, semestreId]);

  const exportarPdf = async () => {
    if (!cursoId || !semestreId) return;
    setExportando(true);
    try {
      await baixarRelatorioPdf(cursoId, semestreId);
    } catch (err: any) {
      setErro(err?.message || 'Erro ao exportar PDF.');
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
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
          className="px-4 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {exportando ? 'Exportando…' : 'Exportar PDF'}
        </button>
      </div>

      {erro && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{erro}</div>}

      {carregando ? (
        <p className="text-sm text-gray-400">Carregando relatório…</p>
      ) : relatorio ? (
        <div className="space-y-4">
          <div className="bg-white border rounded-xl p-4">
            <h3 className="font-semibold text-gray-900">{relatorio.curso} — {relatorio.semestre}</h3>
            {relatorio.coordenador && <p className="text-sm text-gray-500">Coordenador: {relatorio.coordenador}</p>}
            <div className="grid grid-cols-4 gap-3 mt-3">
              {[
                ['Turmas', relatorio.resumo.turmas],
                ['Disciplinas', relatorio.resumo.disciplinas],
                ['Professores', relatorio.resumo.professores],
                ['Carga Total (h)', relatorio.resumo.cargaTotal],
              ].map(([label, valor]) => (
                <div key={label as string} className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{valor}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {relatorio.turmas.map((t) => (
            <div key={t.nome} className="bg-white border rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b font-medium text-sm text-gray-700">{t.nome}</div>
              {t.grade.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400">Sem alocações.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="text-left px-4 py-2">Dia</th>
                      <th className="text-left px-4 py-2">Horário</th>
                      <th className="text-left px-4 py-2">Disciplina</th>
                      <th className="text-left px-4 py-2">Professor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {t.grade.map((a, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2">{a.dia}</td>
                        <td className="px-4 py-2">{a.horario}</td>
                        <td className="px-4 py-2">{a.disciplina}</td>
                        <td className="px-4 py-2">{a.professor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}

          <div className="bg-white border rounded-xl p-4">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Alertas</h4>
            {relatorio.alertas.length === 0 ? (
              <p className="text-sm text-emerald-600">Nenhum alerta encontrado.</p>
            ) : (
              <ul className="space-y-1.5">
                {relatorio.alertas.map((a, i) => (
                  <li key={i} className="text-sm text-amber-700">[{a.tipo}] {a.descricao}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400">Selecione um curso e semestre para emitir o relatório.</p>
      )}
    </div>
  );
}
