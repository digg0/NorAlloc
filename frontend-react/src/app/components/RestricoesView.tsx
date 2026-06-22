import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { restricoesMock, tiposRestricao, professoresMock, type Restricao, type TipoRestricao, type PrioridadeType } from '../data/mockData';

const prioColors: Record<string, string> = {
  Alta: 'bg-red-100 text-red-600',
  Média: 'bg-amber-100 text-amber-700',
  Baixa: 'bg-sky-100 text-sky-600',
};

export function RestricoesView() {
  const [restricoes, setRestricoes] = useState<Restricao[]>(restricoesMock);
  const [search, setSearch] = useState('');
  const [profFilter, setProfFilter] = useState('Todos');
  const [prioFilter, setPrioFilter] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    professorId: professoresMock[0].id,
    tipo: 'Carga reduzida' as TipoRestricao,
    descricao: '',
    prioridade: 'Média' as PrioridadeType,
  });
  const [formError, setFormError] = useState('');

  const filtered = restricoes.filter(r => {
    const matchSearch = r.descricao.toLowerCase().includes(search.toLowerCase()) || r.tipo.toLowerCase().includes(search.toLowerCase()) || r.professorNome.toLowerCase().includes(search.toLowerCase());
    const matchProf = profFilter === 'Todos' || r.professorId === profFilter;
    const matchPrio = prioFilter === 'Todos' || r.prioridade === prioFilter;
    return matchSearch && matchProf && matchPrio;
  });

  const openAdd = () => {
    setEditId(null);
    setForm({ professorId: professoresMock[0].id, tipo: 'Carga reduzida', descricao: '', prioridade: 'Média' });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (r: Restricao) => {
    setEditId(r.id);
    setForm({ professorId: r.professorId, tipo: r.tipo, descricao: r.descricao, prioridade: r.prioridade });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.descricao.trim()) { setFormError('A descrição é obrigatória.'); return; }
    const prof = professoresMock.find(p => p.id === form.professorId)!;
    if (editId) {
      setRestricoes(rs => rs.map(r => r.id === editId ? { ...r, ...form, professorNome: prof.nome } : r));
    } else {
      setRestricoes(rs => [...rs, { id: Date.now().toString(), ...form, professorNome: prof.nome, status: 'Ativa' }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => setRestricoes(rs => rs.filter(r => r.id !== id));
  const toggleStatus = (id: string) => setRestricoes(rs => rs.map(r => r.id === id ? { ...r, status: r.status === 'Ativa' ? 'Inativa' : 'Ativa' } : r));

  return (
    <div className="p-8" style={{ fontFamily: 'Manrope, sans-serif' }}>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between mb-6"
      >
        <div>
          <h1 className="text-gray-800">Restrições e preferências</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Defina restrições individuais para cada professor — limites de carga, turnos preferidos e disponibilidade.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={15} />
          Adicionar restrição
        </motion.button>
      </motion.div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por professor ou tipo..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F] bg-white"
          />
        </div>
        <select
          value={profFilter}
          onChange={e => setProfFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 bg-white"
        >
          <option value="Todos">Todos os professores</option>
          {professoresMock.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {['Todos', 'Alta', 'Média', 'Baixa'].map(p => (
            <button
              key={p}
              onClick={() => setPrioFilter(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                prioFilter === p ? 'bg-[#2D6A4F] text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Professor</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Tipo</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Descrição</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Prioridade</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Status</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((r, i) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center text-[9px] font-bold text-[#2D6A4F]">
                        {r.professorNome.split(' ').slice(0, 2).map(n => n[0]).join('')}
                      </div>
                      <span className="text-xs font-medium text-gray-700">{r.professorNome.split(' ')[0]}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{r.tipo}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-xs">
                    <p className="truncate">{r.descricao}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${prioColors[r.prioridade]}`}>
                      {r.prioridade}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus(r.id)}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-colors ${
                        r.status === 'Ativa' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {r.status}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-[#2D6A4F] hover:bg-[#F0FDF4] rounded-lg transition-all">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-10 text-center">
            <AlertTriangle size={28} className="mx-auto mb-2 text-gray-200" />
            <p className="text-sm text-gray-400">Nenhuma restrição encontrada</p>
          </div>
        )}
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">{restricoes.length} restrição(ões) cadastrada(s)</p>
          <p className="text-xs text-gray-400">{restricoes.filter(r => r.status === 'Ativa').length} ativa(s)</p>
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">{editId ? 'Editar restrição' : 'Nova restrição'}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
              </div>
              <div className="p-5 space-y-4">
                {formError && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Professor</label>
                  <select value={form.professorId} onChange={e => setForm(f => ({ ...f, professorId: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 bg-white">
                    {professoresMock.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Tipo de restrição</label>
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoRestricao }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 bg-white">
                    {tiposRestricao.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Descrição <span className="text-red-500">*</span></label>
                  <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Descreva a restrição ou preferência em detalhes..." rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 resize-none bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Prioridade</label>
                  <div className="flex gap-2">
                    {(['Alta', 'Média', 'Baixa'] as PrioridadeType[]).map(p => (
                      <button
                        key={p}
                        onClick={() => setForm(f => ({ ...f, prioridade: p }))}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors border ${
                          form.prioridade === p
                            ? p === 'Alta' ? 'bg-red-50 border-red-300 text-red-600' : p === 'Média' ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-sky-50 border-sky-300 text-sky-600'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">Cancelar</button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} className="px-4 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-sm font-medium rounded-lg transition-colors">
                  {editId ? 'Salvar' : 'Adicionar'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
