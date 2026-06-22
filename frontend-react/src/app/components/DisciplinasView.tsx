import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, X, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { disciplinasMock, type Disciplina, type TurnoType } from '../data/mockData';

type FormData = Omit<Disciplina, 'id'>;

const emptyForm: FormData = { codigo: '', nome: '', cargaHoraria: 60, periodo: 1, curso: 'ADS', turno: 'Manhã' };

const turnoColors: Record<TurnoType, string> = {
  Manhã: 'bg-sky-100 text-sky-700',
  Tarde: 'bg-orange-100 text-orange-700',
  Noite: 'bg-purple-100 text-purple-700',
};

export function DisciplinasView() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>(disciplinasMock);
  const [search, setSearch] = useState('');
  const [turnoFilter, setTurnoFilter] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [formError, setFormError] = useState('');

  const filtered = disciplinas.filter(d => {
    const matchSearch =
      d.nome.toLowerCase().includes(search.toLowerCase()) ||
      d.codigo.toLowerCase().includes(search.toLowerCase());
    const matchTurno = turnoFilter === 'Todos' || d.turno === turnoFilter;
    return matchSearch && matchTurno;
  });

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (d: Disciplina) => {
    setEditId(d.id);
    setForm({ codigo: d.codigo, nome: d.nome, cargaHoraria: d.cargaHoraria, periodo: d.periodo, curso: d.curso, turno: d.turno });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.nome.trim() || !form.codigo.trim()) {
      setFormError('Nome e código são obrigatórios.');
      return;
    }
    if (editId) {
      setDisciplinas(ds => ds.map(d => d.id === editId ? { ...d, ...form } : d));
    } else {
      setDisciplinas(ds => [...ds, { id: Date.now().toString(), ...form }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => setDisciplinas(ds => ds.filter(d => d.id !== id));

  return (
    <div className="p-8" style={{ fontFamily: 'Manrope, sans-serif' }}>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-gray-800">Disciplinas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie as disciplinas disponíveis para alocação.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={15} />
          Adicionar disciplina
        </motion.button>
      </motion.div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar disciplina..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F] bg-white"
          />
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {['Todos', 'Manhã', 'Tarde', 'Noite'].map(t => (
            <button
              key={t}
              onClick={() => setTurnoFilter(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                turnoFilter === t ? 'bg-[#2D6A4F] text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
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
              {['Código', 'Nome', 'C.H.', 'Período', 'Curso', 'Turno', ''].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((d, i) => (
                <motion.tr
                  key={d.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors group"
                >
                  <td className="px-4 py-3 text-xs font-mono font-medium text-gray-600">{d.codigo}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{d.nome}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{d.cargaHoraria}h</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{d.periodo}º</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{d.curso}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${turnoColors[d.turno]}`}>
                      {d.turno}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(d)} className="p-1.5 text-gray-400 hover:text-[#2D6A4F] hover:bg-[#F0FDF4] rounded-lg transition-all">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(d.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
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
            <BookOpen size={28} className="mx-auto mb-2 text-gray-200" />
            <p className="text-sm text-gray-400">Nenhuma disciplina encontrada</p>
          </div>
        )}
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400">{disciplinas.length} disciplina(s) cadastrada(s)</p>
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
                <h3 className="text-sm font-semibold text-gray-800">
                  {editId ? 'Editar disciplina' : 'Nova disciplina'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                {formError && (
                  <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Código *</label>
                    <input
                      value={form.codigo}
                      onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                      placeholder="Ex.: ADS101"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Curso</label>
                    <input
                      value={form.curso}
                      onChange={e => setForm(f => ({ ...f, curso: e.target.value }))}
                      placeholder="Ex.: ADS"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Nome da disciplina *</label>
                  <input
                    value={form.nome}
                    onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                    placeholder="Ex.: Programação Orientada a Objeto"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 bg-white"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">C.H. (horas)</label>
                    <input
                      type="number"
                      value={form.cargaHoraria}
                      onChange={e => setForm(f => ({ ...f, cargaHoraria: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Período</label>
                    <input
                      type="number"
                      min={1} max={10}
                      value={form.periodo}
                      onChange={e => setForm(f => ({ ...f, periodo: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Turno</label>
                    <select
                      value={form.turno}
                      onChange={e => setForm(f => ({ ...f, turno: e.target.value as TurnoType }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 bg-white"
                    >
                      <option>Manhã</option>
                      <option>Tarde</option>
                      <option>Noite</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  Cancelar
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  className="px-4 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-sm font-medium rounded-lg transition-colors"
                >
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
