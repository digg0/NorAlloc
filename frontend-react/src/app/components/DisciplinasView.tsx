import { useEffect, useState } from 'react';
import { listarDisciplinasBackend, criarDisciplinaBackend, atualizarDisciplinaBackend, removerDisciplinaBackend, type DisciplinaBackendUI, type DisciplinaFormData } from '../services/disciplinasBackend';
import { listarCursos, type CursoUI } from '../services/cursos';

const emptyForm: DisciplinaFormData = { nome: '', cursoId: 0, cargaHoraria: 1 };

export function DisciplinasView() {
  const [disciplinas, setDisciplinas] = useState<DisciplinaBackendUI[]>([]);
  const [cursos, setCursos] = useState<CursoUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [modal, setModal] = useState<{ open: boolean; editId: number | null }>({ open: false, editId: null });
  const [form, setForm] = useState<DisciplinaFormData>(emptyForm);
  const [formErro, setFormErro] = useState('');

  const carregar = () => {
    setLoading(true);
    Promise.all([listarDisciplinasBackend(), listarCursos()])
      .then(([d, c]) => { setDisciplinas(d); setCursos(c); setErro(''); })
      .catch((err) => setErro(err?.message || 'Falha ao carregar disciplinas.'))
      .finally(() => setLoading(false));
  };

  useEffect(carregar, []);

  const nomeCurso = (id: number) => cursos.find((c) => c.id === id)?.nome ?? `Curso #${id}`;

  const abrirNovo = () => { setForm({ ...emptyForm, cursoId: cursos[0]?.id ?? 0 }); setFormErro(''); setModal({ open: true, editId: null }); };
  const abrirEdicao = (d: DisciplinaBackendUI) => {
    setForm({ nome: d.nome, cursoId: d.cursoId, cargaHoraria: d.cargaHoraria });
    setFormErro('');
    setModal({ open: true, editId: d.id });
  };

  const salvar = async () => {
    if (!form.nome.trim() || !form.cursoId || form.cargaHoraria <= 0) {
      setFormErro('Informe nome, curso e carga horária.');
      return;
    }
    try {
      if (modal.editId !== null) {
        const atualizada = await atualizarDisciplinaBackend(modal.editId, form);
        setDisciplinas((ds) => ds.map((d) => (d.id === modal.editId ? atualizada : d)));
      } else {
        const nova = await criarDisciplinaBackend(form);
        setDisciplinas((ds) => [...ds, nova]);
      }
      setModal({ open: false, editId: null });
    } catch (err: any) {
      setFormErro(err?.message || 'Erro ao salvar disciplina.');
    }
  };

  const excluir = async (id: number) => {
    try {
      await removerDisciplinaBackend(id);
      setDisciplinas((ds) => ds.filter((d) => d.id !== id));
    } catch (err: any) {
      setErro(err?.message || 'Erro ao remover disciplina.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Matriz curricular — carga horária semanal em aulas.</p>
        <button onClick={abrirNovo} className="px-4 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-sm font-medium rounded-lg transition-colors">
          Nova disciplina
        </button>
      </div>

      {erro && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{erro}</div>}

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2.5">Nome</th>
              <th className="text-left px-4 py-2.5">Curso</th>
              <th className="text-left px-4 py-2.5">Carga Horária</th>
              <th className="text-right px-4 py-2.5">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Carregando…</td></tr>
            ) : disciplinas.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Nenhuma disciplina cadastrada.</td></tr>
            ) : (
              disciplinas.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium">{d.nome}</td>
                  <td className="px-4 py-2.5">{nomeCurso(d.cursoId)}</td>
                  <td className="px-4 py-2.5">{d.cargaHoraria}h</td>
                  <td className="px-4 py-2.5 text-right space-x-2">
                    <button onClick={() => abrirEdicao(d)} className="text-xs font-medium text-[#1B4332] hover:underline">Editar</button>
                    <button onClick={() => excluir(d.id)} className="text-xs font-medium text-red-500 hover:underline">Excluir</button>
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
            <h3 className="font-semibold text-gray-900">{modal.editId !== null ? 'Editar disciplina' : 'Nova disciplina'}</h3>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome da disciplina</label>
              <input
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex.: Banco de Dados"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Curso</label>
              <select
                value={form.cursoId}
                onChange={(e) => setForm((f) => ({ ...f, cursoId: Number(e.target.value) }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value={0}>Selecione…</option>
                {cursos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Carga horária (h/semana)</label>
              <input
                type="number"
                min={1}
                value={form.cargaHoraria}
                onChange={(e) => setForm((f) => ({ ...f, cargaHoraria: Number(e.target.value) }))}
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
