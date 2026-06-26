import { useEffect, useState } from 'react';
import {
  listarCoordenadores,
  criarCoordenador,
  atualizarCoordenador,
  removerCoordenador,
  type CoordenadorUI,
  type CoordenadorFormData,
} from '../services/coordenadores';
import { listarCursos, type CursoUI } from '../services/cursos';
import { listarProfessores, type ProfessorUI } from '../services/professores';

const emptyForm: CoordenadorFormData = { cursoId: 0, professorId: 0, password: '' };

export function CoordenadoresView() {
  const [coordenadores, setCoordenadores] = useState<CoordenadorUI[]>([]);
  const [cursos, setCursos] = useState<CursoUI[]>([]);
  const [professores, setProfessores] = useState<ProfessorUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [modal, setModal] = useState<{ open: boolean; editId: number | null }>({ open: false, editId: null });
  const [form, setForm] = useState<CoordenadorFormData>(emptyForm);
  const [formErro, setFormErro] = useState('');

  const carregar = () => {
    setLoading(true);
    Promise.all([listarCoordenadores(), listarCursos(), listarProfessores()])
      .then(([c, cu, p]) => { setCoordenadores(c); setCursos(cu); setProfessores(p); setErro(''); })
      .catch((err) => setErro(err?.message || 'Falha ao carregar coordenadores.'))
      .finally(() => setLoading(false));
  };

  useEffect(carregar, []);

  const nomeCurso = (id: number) => cursos.find((c) => c.id === id)?.nome ?? `Curso #${id}`;

  // Professores que já são coordenador de outro curso não devem aparecer
  // como opção (exceto o próprio, ao editar) — um professor coordena 1 curso.
  const professoresDisponiveis = (editId: number | null) =>
    professores.filter((p) => {
      const coordAtual = coordenadores.find((c) => c.professorId === p.id);
      return !coordAtual || coordAtual.id === editId;
    });

  const abrirNovo = () => { setForm(emptyForm); setFormErro(''); setModal({ open: true, editId: null }); };
  const abrirEdicao = (c: CoordenadorUI) => {
    setForm({ cursoId: c.cursoId, professorId: c.professorId ?? 0, password: '' });
    setFormErro('');
    setModal({ open: true, editId: c.id });
  };

  const salvar = async () => {
    if (!form.cursoId || !form.professorId) {
      setFormErro('Selecione o curso e o professor que vai coordenar.');
      return;
    }
    try {
      if (modal.editId !== null) {
        const atualizado = await atualizarCoordenador(modal.editId, form);
        setCoordenadores((cs) => cs.map((c) => (c.id === modal.editId ? atualizado : c)));
      } else {
        const novo = await criarCoordenador(form);
        setCoordenadores((cs) => [...cs, novo]);
      }
      setModal({ open: false, editId: null });
    } catch (err: any) {
      setFormErro(err?.message || 'Erro ao salvar coordenador.');
    }
  };

  const remover = async (id: number) => {
    try {
      await removerCoordenador(id);
      setCoordenadores((cs) => cs.filter((c) => c.id !== id));
    } catch (err: any) {
      setErro(err?.message || 'Erro ao remover coordenador.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Coordenadores são docentes da instituição — selecione quem coordena cada curso.</p>
        <button onClick={abrirNovo} className="px-4 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-sm font-medium rounded-lg transition-colors">
          Novo coordenador
        </button>
      </div>

      {erro && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{erro}</div>}

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2.5">Nome</th>
              <th className="text-left px-4 py-2.5">E-mail</th>
              <th className="text-left px-4 py-2.5">Curso</th>
              <th className="text-right px-4 py-2.5">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Carregando…</td></tr>
            ) : coordenadores.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Nenhum coordenador cadastrado.</td></tr>
            ) : (
              coordenadores.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium">{c.nome}</td>
                  <td className="px-4 py-2.5">{c.email}</td>
                  <td className="px-4 py-2.5">{nomeCurso(c.cursoId)}</td>
                  <td className="px-4 py-2.5 text-right space-x-2">
                    <button onClick={() => abrirEdicao(c)} className="text-xs font-medium text-[#1B4332] hover:underline">Editar / Trocar</button>
                    <button onClick={() => remover(c.id)} className="text-xs font-medium text-red-500 hover:underline">Remover</button>
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
            <h3 className="font-semibold text-gray-900">{modal.editId !== null ? 'Editar coordenador' : 'Novo coordenador'}</h3>

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
              <label className="block text-xs font-medium text-gray-600 mb-1">Professor (docente que vai coordenar)</label>
              <select
                value={form.professorId}
                onChange={(e) => setForm((f) => ({ ...f, professorId: Number(e.target.value) }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value={0}>Selecione…</option>
                {professoresDisponiveis(modal.editId).map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Senha de acesso {modal.editId !== null && <span className="text-gray-400">(deixe em branco para manter)</span>}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Mínimo 8 caracteres"
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
