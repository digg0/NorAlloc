import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { professoresMock, type Professor, type Titulacao } from '../data/mockData';

type FormData = Omit<Professor, 'id'>;

const emptyForm: FormData = { nome: '', email: '', area: '', titulacao: 'Mestre', cargaMaxima: 20 };

const titColors: Record<Titulacao, string> = {
  Especialista: 'bg-gray-100 text-gray-600',
  Mestre: 'bg-sky-100 text-sky-700',
  Doutor: 'bg-purple-100 text-purple-700',
};

function initials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export function ProfessoresView() {
  const [professores, setProfessores] = useState<Professor[]>(professoresMock);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [formError, setFormError] = useState('');

  const filtered = professores.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.area.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditId(null); setForm(emptyForm); setFormError(''); setShowModal(true); };
  const openEdit = (p: Professor) => {
    setEditId(p.id);
    setForm({ nome: p.nome, email: p.email, area: p.area, titulacao: p.titulacao, cargaMaxima: p.cargaMaxima });
    setFormError('');
    setShowModal(true);
  };
  const handleSave = () => {
    if (!form.nome.trim() || !form.email.trim()) { setFormError('Nome e e-mail são obrigatórios.'); return; }
    if (editId) {
      setProfessores(ps => ps.map(p => p.id === editId ? { ...p, ...form } : p));
    } else {
      setProfessores(ps => [...ps, { id: Date.now().toString(), ...form }]);
    }
    setShowModal(false);
  };
  const handleDelete = (id: string) => setProfessores(ps => ps.filter(p => p.id !== id));

  return (
    <div className="p-8" style={{ fontFamily: 'Manrope, sans-serif' }}>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-gray-800">Professores</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie o corpo docente disponível para alocação.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={15} />
          Adicionar professor
        </motion.button>
      </motion.div>

      <div className="relative max-w-xs mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar professor ou área..."
          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F] bg-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <AnimatePresence>
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2D6A4F]/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-[#2D6A4F]">{initials(p.nome)}</span>
                  </div>
                  <div>
                    <h4 className="text-gray-800 text-sm font-semibold">{p.nome}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{p.area}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-[#2D6A4F] hover:bg-[#F0FDF4] rounded-lg transition-all">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${titColors[p.titulacao]}`}>
                    {p.titulacao}
                  </span>
                  <span className="text-[10px] text-gray-400">{p.cargaMaxima}h máx/sem</span>
                </div>
                <p className="text-[11px] text-gray-400 truncate max-w-[130px]">{p.email}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Users size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum professor encontrado</p>
        </div>
      )}

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
                  {editId ? 'Editar professor' : 'Novo professor'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                {formError && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Nome completo *</label>
                  <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex.: João da Silva" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">E-mail institucional *</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Ex.: joao.silva@ifce.edu.br" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Área de atuação</label>
                  <input value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} placeholder="Ex.: Ciência da Computação" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 bg-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Titulação</label>
                    <select value={form.titulacao} onChange={e => setForm(f => ({ ...f, titulacao: e.target.value as Titulacao }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 bg-white">
                      <option>Especialista</option>
                      <option>Mestre</option>
                      <option>Doutor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">C.H. máxima (h)</label>
                    <input type="number" min={1} max={40} value={form.cargaMaxima} onChange={e => setForm(f => ({ ...f, cargaMaxima: parseInt(e.target.value) || 20 }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 bg-white" />
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
