import { useEffect, useState } from 'react';
import { listarCursos, criarCurso, atualizarCurso, inativarCurso, reativarCurso, type CursoUI, type CursoFormData } from '../services/cursos';

const emptyForm: CursoFormData = { nome: '', nivel: '' };

export function CursosView() {
  const [cursos, setCursos] = useState<CursoUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [modal, setModal] = useState<{ open: boolean; editId: number | null }>({ open: false, editId: null });
  const [form, setForm] = useState<CursoFormData>(emptyForm);
  const [formErro, setFormErro] = useState('');

  const carregar = () => {
    setLoading(true);
    listarCursos()
      .then(setCursos)
      .catch((err) => setErro(err?.message || 'Falha ao carregar cursos.'))
      .finally(() => setLoading(false));
  };

  useEffect(carregar, []);

  const abrirNovo = () => { setForm(emptyForm); setFormErro(''); setModal({ open: true, editId: null }); };
  const abrirEdicao = (c: CursoUI) => { setForm({ nome: c.nome, nivel: c.nivel }); setFormErro(''); setModal({ open: true, editId: c.id }); };

  const salvar = async () => {
    if (!form.nome.trim() || !form.nivel.trim()) { setFormErro('Nome e nível são obrigatórios.'); return; }
    try {
      if (modal.editId !== null) {
        const atualizado = await atualizarCurso(modal.editId, form);
        setCursos((cs) => cs.map((c) => (c.id === modal.editId ? atualizado : c)));
      } else {
        const novo = await criarCurso(form);
        setCursos((cs) => [...cs, novo]);
      }
      setModal({ open: false, editId: null });
    } catch (err: any) {
      setFormErro(err?.message || 'Erro ao salvar curso.');
    }
  };

  const alternarAtivo = async (c: CursoUI) => {
    try {
      const atualizado = c.ativo ? await inativarCurso(c.id) : await reativarCurso(c.id);
      setCursos((cs) => cs.map((x) => (x.id === c.id ? atualizado : x)));
    } catch (err: any) {
      setErro(err?.message || 'Erro ao atualizar status do curso.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Cursos institucionais — cadastro exclusivo do Administrador.</p>
        <button onClick={abrirNovo} className="px-4 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-sm font-medium rounded-lg transition-colors">
          Novo curso
        </button>
      </div>

      {erro && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{erro}</div>}

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2.5">Nome</th>
              <th className="text-left px-4 py-2.5">Nível</th>
              <th className="text-left px-4 py-2.5">Status</th>
              <th className="text-right px-4 py-2.5">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Carregando…</td></tr>
            ) : cursos.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Nenhum curso cadastrado.</td></tr>
            ) : (
              cursos.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium">{c.nome}</td>
                  <td className="px-4 py-2.5">{c.nivel}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right space-x-2">
                    <button onClick={() => abrirEdicao(c)} className="text-xs font-medium text-[#1B4332] hover:underline">Editar</button>
                    <button onClick={() => alternarAtivo(c)} className="text-xs font-medium text-amber-600 hover:underline">
                      {c.ativo ? 'Inativar' : 'Reativar'}
                    </button>
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
            <h3 className="font-semibold text-gray-900">{modal.editId !== null ? 'Editar curso' : 'Novo curso'}</h3>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome do curso</label>
              <input
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex.: Análise e Desenvolvimento de Sistemas"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nível</label>
              <input
                value={form.nivel}
                onChange={(e) => setForm((f) => ({ ...f, nivel: e.target.value }))}
                placeholder="Ex.: Tecnólogo, Licenciatura, Técnico"
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
