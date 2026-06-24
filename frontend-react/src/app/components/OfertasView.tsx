import { useEffect, useState } from 'react';
import { listarOfertas, criarOferta, atualizarOferta, removerOferta, type OfertaUI, type OfertaFormData } from '../services/ofertas';
import { listarTurmasBackend, type TurmaBackendUI } from '../services/turmasBackend';
import { listarDisciplinasBackend, type DisciplinaBackendUI } from '../services/disciplinasBackend';
import { listarProfessores, type ProfessorUI } from '../services/professores';

const emptyForm: OfertaFormData = { turmaId: 0, disciplinaId: 0, professorId: null, cargaHoraria: 1 };

export function OfertasView() {
  const [ofertas, setOfertas] = useState<OfertaUI[]>([]);
  const [turmas, setTurmas] = useState<TurmaBackendUI[]>([]);
  const [disciplinas, setDisciplinas] = useState<DisciplinaBackendUI[]>([]);
  const [professores, setProfessores] = useState<ProfessorUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [modal, setModal] = useState<{ open: boolean; editId: number | null }>({ open: false, editId: null });
  const [form, setForm] = useState<OfertaFormData>(emptyForm);
  const [formErro, setFormErro] = useState('');

  const carregar = () => {
    setLoading(true);
    Promise.all([listarOfertas(), listarTurmasBackend(), listarDisciplinasBackend(), listarProfessores()])
      .then(([o, t, d, p]) => {
        setOfertas(o);
        setTurmas(t);
        setDisciplinas(d);
        setProfessores(p);
        setErro('');
      })
      .catch((err) => setErro(err?.message || 'Falha ao carregar ofertas.'))
      .finally(() => setLoading(false));
  };

  useEffect(carregar, []);

  const nomeTurma = (id: number) => turmas.find((t) => t.id === id)?.nome ?? `Turma #${id}`;
  const nomeDisciplina = (id: number) => disciplinas.find((d) => d.id === id)?.nome ?? `Disciplina #${id}`;
  const nomeProfessor = (id: number | null) => (id ? professores.find((p) => p.id === id)?.nome ?? `Professor #${id}` : '— sem professor —');

  const abrirNovo = () => { setForm(emptyForm); setFormErro(''); setModal({ open: true, editId: null }); };
  const abrirEdicao = (o: OfertaUI) => {
    setForm({ turmaId: o.turmaId, disciplinaId: o.disciplinaId, professorId: o.professorId, cargaHoraria: o.cargaHoraria });
    setFormErro('');
    setModal({ open: true, editId: o.id });
  };

  const salvar = async () => {
    if (!form.turmaId || !form.disciplinaId || form.cargaHoraria <= 0) {
      setFormErro('Selecione turma, disciplina e informe a carga horária.');
      return;
    }
    try {
      if (modal.editId !== null) {
        const atualizada = await atualizarOferta(modal.editId, form);
        setOfertas((os) => os.map((o) => (o.id === modal.editId ? atualizada : o)));
      } else {
        const nova = await criarOferta(form);
        setOfertas((os) => [...os, nova]);
      }
      setModal({ open: false, editId: null });
    } catch (err: any) {
      setFormErro(err?.message || 'Erro ao salvar oferta.');
    }
  };

  const excluir = async (id: number) => {
    try {
      await removerOferta(id);
      setOfertas((os) => os.filter((o) => o.id !== id));
    } catch (err: any) {
      setErro(err?.message || 'Erro ao remover oferta.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Disciplinas a ofertar por turma — entrada do solver de geração de grade.</p>
        <button onClick={abrirNovo} className="px-4 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-sm font-medium rounded-lg transition-colors">
          Nova oferta
        </button>
      </div>

      {erro && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{erro}</div>}

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2.5">Turma</th>
              <th className="text-left px-4 py-2.5">Disciplina</th>
              <th className="text-left px-4 py-2.5">Professor</th>
              <th className="text-left px-4 py-2.5">Carga (aulas/sem.)</th>
              <th className="text-right px-4 py-2.5">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Carregando…</td></tr>
            ) : ofertas.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Nenhuma oferta cadastrada.</td></tr>
            ) : (
              ofertas.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5">{nomeTurma(o.turmaId)}</td>
                  <td className="px-4 py-2.5">{nomeDisciplina(o.disciplinaId)}</td>
                  <td className="px-4 py-2.5">{nomeProfessor(o.professorId)}</td>
                  <td className="px-4 py-2.5">{o.cargaHoraria}</td>
                  <td className="px-4 py-2.5 text-right space-x-2">
                    <button onClick={() => abrirEdicao(o)} className="text-xs font-medium text-[#1B4332] hover:underline">Editar</button>
                    <button onClick={() => excluir(o.id)} className="text-xs font-medium text-red-500 hover:underline">Excluir</button>
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
            <h3 className="font-semibold text-gray-900">{modal.editId !== null ? 'Editar oferta' : 'Nova oferta'}</h3>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Turma</label>
              <select
                value={form.turmaId}
                onChange={(e) => setForm((f) => ({ ...f, turmaId: Number(e.target.value) }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value={0}>Selecione…</option>
                {turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Disciplina</label>
              <select
                value={form.disciplinaId}
                onChange={(e) => setForm((f) => ({ ...f, disciplinaId: Number(e.target.value) }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value={0}>Selecione…</option>
                {disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Professor responsável</label>
              <select
                value={form.professorId ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, professorId: Number(e.target.value) || null }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value={0}>Sem professor (definir depois)</option>
                {professores.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Carga horária (aulas/semana)</label>
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
