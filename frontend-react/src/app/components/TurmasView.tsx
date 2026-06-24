import { useEffect, useState } from 'react';
import { listarTurmasBackend, criarTurmaBackend, atualizarTurmaBackend, removerTurmaBackend, type TurmaBackendUI, type TurmaFormData } from '../services/turmasBackend';
import { listarCursos, type CursoUI } from '../services/cursos';
import { listarSemestres, type SemestreUI } from '../services/semestres';

const emptyForm: TurmaFormData = { nome: '', cursoId: null, semestreId: null, semestreNivel: null };

export function TurmasView() {
  const [turmas, setTurmas] = useState<TurmaBackendUI[]>([]);
  const [cursos, setCursos] = useState<CursoUI[]>([]);
  const [semestres, setSemestres] = useState<SemestreUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [modal, setModal] = useState<{ open: boolean; editId: number | null }>({ open: false, editId: null });
  const [form, setForm] = useState<TurmaFormData>(emptyForm);
  const [formErro, setFormErro] = useState('');

  const carregar = () => {
    setLoading(true);
    Promise.all([listarTurmasBackend(), listarCursos(), listarSemestres()])
      .then(([t, c, s]) => { setTurmas(t); setCursos(c); setSemestres(s); setErro(''); })
      .catch((err) => setErro(err?.message || 'Falha ao carregar turmas.'))
      .finally(() => setLoading(false));
  };

  useEffect(carregar, []);

  const nomeCurso = (id: number | null) => (id ? cursos.find((c) => c.id === id)?.nome ?? `Curso #${id}` : '—');
  const nomeSemestre = (id: number | null) => (id ? semestres.find((s) => s.id === id)?.nome ?? `Semestre #${id}` : '—');

  const abrirNovo = () => { setForm(emptyForm); setFormErro(''); setModal({ open: true, editId: null }); };
  const abrirEdicao = (t: TurmaBackendUI) => {
    setForm({ nome: t.nome, cursoId: t.cursoId, semestreId: t.semestreId, semestreNivel: t.semestreNivel });
    setFormErro('');
    setModal({ open: true, editId: t.id });
  };

  const salvar = async () => {
    if (!form.nome.trim()) { setFormErro('Informe o nome da turma.'); return; }
    try {
      if (modal.editId !== null) {
        const atualizada = await atualizarTurmaBackend(modal.editId, form);
        setTurmas((ts) => ts.map((t) => (t.id === modal.editId ? atualizada : t)));
      } else {
        const nova = await criarTurmaBackend(form);
        setTurmas((ts) => [...ts, nova]);
      }
      setModal({ open: false, editId: null });
    } catch (err: any) {
      setFormErro(err?.message || 'Erro ao salvar turma.');
    }
  };

  const excluir = async (id: number) => {
    try {
      await removerTurmaBackend(id);
      setTurmas((ts) => ts.filter((t) => t.id !== id));
    } catch (err: any) {
      setErro(err?.message || 'Erro ao remover turma.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Turmas por curso e semestre.</p>
        <button onClick={abrirNovo} className="px-4 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-sm font-medium rounded-lg transition-colors">
          Nova turma
        </button>
      </div>

      {erro && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{erro}</div>}

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2.5">Nome</th>
              <th className="text-left px-4 py-2.5">Curso</th>
              <th className="text-left px-4 py-2.5">Semestre</th>
              <th className="text-left px-4 py-2.5">Período</th>
              <th className="text-right px-4 py-2.5">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Carregando…</td></tr>
            ) : turmas.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Nenhuma turma cadastrada.</td></tr>
            ) : (
              turmas.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium">{t.nome}</td>
                  <td className="px-4 py-2.5">{nomeCurso(t.cursoId)}</td>
                  <td className="px-4 py-2.5">{nomeSemestre(t.semestreId)}</td>
                  <td className="px-4 py-2.5">{t.semestreNivel ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right space-x-2">
                    <button onClick={() => abrirEdicao(t)} className="text-xs font-medium text-[#1B4332] hover:underline">Editar</button>
                    <button onClick={() => excluir(t.id)} className="text-xs font-medium text-red-500 hover:underline">Excluir</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 space-y-4">
            <h3 className="font-semibold text-gray-900">{modal.editId !== null ? 'Editar turma' : 'Nova turma'}</h3>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome da turma</label>
              <input
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex.: ADS2"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Curso</label>
              <select
                value={form.cursoId ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, cursoId: Number(e.target.value) || null }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value={0}>Selecione…</option>
                {cursos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Semestre</label>
              <select
                value={form.semestreId ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, semestreId: Number(e.target.value) || null }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value={0}>Selecione…</option>
                {semestres.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Período/Nível (ex.: 2º semestre do curso)</label>
              <input
                type="number"
                min={1}
                value={form.semestreNivel ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, semestreNivel: Number(e.target.value) || null }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {formErro && <p className="text-xs text-red-600">{formErro}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModal({ open: false, editId: null })} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
              <button onClick={salvar} className="px-4 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-sm font-medium rounded-lg">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
