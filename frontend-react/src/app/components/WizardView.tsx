import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronRight, ChevronLeft, X, Plus, Search, Check, Trash2,
  ArrowRight, Play, Loader2, CheckCircle2, AlertTriangle, Filter
} from 'lucide-react';
import {
  disciplinasMock, restricoesMock, tiposRestricao, professoresMock,
  type Restricao, type TipoRestricao, type PrioridadeType
} from '../data/mockData';

interface WizardViewProps {
  step: number;
  onStep: (s: number) => void;
  onFinish: () => void;
  onCancel: () => void;
  semestreId: string | null;
}

// ─── Step 1: Novo Semestre Form ────────────────────────────────────────────────

interface SemestreFormData {
  nome: string;
  codigo: string;
  dataInicio: string;
  dataFim: string;
  observacoes: string;
}

function StepSemestre({ onNext, initialData }: { onNext: (data: SemestreFormData) => void; initialData: SemestreFormData }) {
  const [form, setForm] = useState<SemestreFormData>(initialData);
  const [errors, setErrors] = useState<Partial<SemestreFormData>>({});

  const validate = () => {
    const e: Partial<SemestreFormData> = {};
    if (!form.nome.trim()) e.nome = 'Campo obrigatório';
    if (!form.dataInicio) e.dataInicio = 'Campo obrigatório';
    if (!form.dataFim) e.dataFim = 'Campo obrigatório';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onNext(form);
  };

  const field = (
    label: string,
    key: keyof SemestreFormData,
    type: string = 'text',
    placeholder: string = '',
    hint?: string
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {key !== 'observacoes' && <span className="text-red-500">*</span>}
      </label>
      {key === 'observacoes' ? (
        <textarea
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition-all resize-none bg-white"
        />
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={e => {
            setForm(f => ({ ...f, [key]: e.target.value }));
            setErrors(er => ({ ...er, [key]: undefined }));
          }}
          placeholder={placeholder}
          className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition-all bg-white ${
            errors[key] ? 'border-red-400 bg-red-50' : 'border-gray-200'
          }`}
        />
      )}
      {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
      {hint && <p className="text-gray-400 text-xs mt-1">{hint}</p>}
    </div>
  );

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h2 className="text-gray-800 mb-1">Criar novo semestre</h2>
        <p className="text-gray-500 text-sm">Preencha as informações básicas para identificar o PCS.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        {field('Nome do semestre', 'nome', 'text', 'Ex.: 2024.1')}
        {field('Código / Referência', 'codigo', 'text', 'Ex.: 2024.1')}
        <div className="grid grid-cols-2 gap-4">
          {field('Data de início', 'dataInicio', 'date')}
          {field('Data de fim', 'dataFim', 'date')}
        </div>
        {field('Observações', 'observacoes', 'text', 'Informações adicionais sobre o semestre...')}
      </div>

      <div className="flex items-center gap-3 mt-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          className="flex items-center gap-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Check size={15} />
          Criar semestre
        </motion.button>
        <p className="text-xs text-gray-400">Você poderá editar essas informações depois</p>
      </div>

      <div className="mt-6 p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2">
        <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700">
          Próximos passos: configure a oferta de disciplinas, defina restrições dos professores e inicie a simulação de alocação.
        </p>
      </div>
    </div>
  );
}

// ─── Step 2: Oferta ────────────────────────────────────────────────────────────

function StepOferta({ onNext, selectedIds, onSelectionChange }: {
  onNext: () => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState('');
  const [turnoFilter, setTurnoFilter] = useState<string>('Todos');

  const available = disciplinasMock.filter(d => {
    const matchSearch = d.nome.toLowerCase().includes(search.toLowerCase()) || d.codigo.toLowerCase().includes(search.toLowerCase());
    const matchTurno = turnoFilter === 'Todos' || d.turno === turnoFilter;
    return matchSearch && matchTurno && !selectedIds.includes(d.id);
  });

  const selected = disciplinasMock.filter(d => selectedIds.includes(d.id));

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const turnoColors: Record<string, string> = {
    Manhã: 'bg-sky-100 text-sky-700',
    Tarde: 'bg-orange-100 text-orange-700',
    Noite: 'bg-purple-100 text-purple-700',
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-gray-800 mb-1">Oferta do semestre</h2>
        <p className="text-gray-500 text-sm">Selecione e configure as disciplinas que serão ofertadas neste semestre.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Available */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Disciplinas disponíveis</span>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{available.length}</span>
            </div>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar disciplinas..."
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F]"
              />
            </div>
            <div className="flex gap-1">
              {['Todos', 'Manhã', 'Tarde', 'Noite'].map(t => (
                <button
                  key={t}
                  onClick={() => setTurnoFilter(t)}
                  className={`text-[10px] px-2 py-1 rounded-md font-medium transition-colors ${
                    turnoFilter === t ? 'bg-[#2D6A4F] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-y-auto max-h-80">
            {available.map(d => (
              <motion.button
                key={d.id}
                whileHover={{ x: 2 }}
                onClick={() => toggle(d.id)}
                className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-50 hover:bg-[#F0FDF4] transition-colors text-left group"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{d.nome}</p>
                  <p className="text-[10px] text-gray-400">{d.codigo} · {d.cargaHoraria}h · {d.periodo}º período</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${turnoColors[d.turno]}`}>{d.turno}</span>
                  <Plus size={13} className="text-gray-300 group-hover:text-[#2D6A4F] transition-colors" />
                </div>
              </motion.button>
            ))}
            {available.length === 0 && (
              <div className="p-6 text-center text-gray-400 text-xs">Nenhuma disciplina encontrada</div>
            )}
          </div>
        </div>

        {/* Selected */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Disciplinas selecionadas</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selected.length > 0 ? 'bg-[#BBF7D0] text-[#15803D]' : 'bg-gray-100 text-gray-400'}`}>
              {selected.length}
            </span>
          </div>
          <div className="overflow-y-auto max-h-80">
            <AnimatePresence>
              {selected.map(d => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center justify-between px-4 py-3 border-b border-gray-50 group"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{d.nome}</p>
                    <p className="text-[10px] text-gray-400">{d.codigo} · {d.cargaHoraria}h · {d.periodo}º período</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${turnoColors[d.turno]}`}>{d.turno}</span>
                    <button
                      onClick={() => toggle(d.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {selected.length === 0 && (
              <div className="p-6 text-center">
                <p className="text-gray-400 text-xs">Nenhuma disciplina selecionada</p>
                <p className="text-gray-300 text-[10px] mt-1">Clique nas disciplinas à esquerda para adicionar</p>
              </div>
            )}
          </div>
          {selected.length > 0 && (
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <p className="text-[10px] text-gray-400">
                Total: {selected.reduce((a, d) => a + d.cargaHoraria, 0)}h de carga horária
              </p>
              <button
                onClick={() => onSelectionChange([])}
                className="text-[10px] text-red-400 hover:text-red-600 transition-colors"
              >
                Limpar tudo
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNext}
          disabled={selected.length === 0}
          className="flex items-center gap-2 bg-[#2D6A4F] hover:bg-[#1B4332] disabled:bg-gray-200 disabled:text-gray-400 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          Confirmar seleção
          <ChevronRight size={15} />
        </motion.button>
        {selected.length === 0 && (
          <p className="text-xs text-gray-400">Selecione ao menos uma disciplina para continuar</p>
        )}
      </div>
    </div>
  );
}

// ─── Step 3: Restrições ────────────────────────────────────────────────────────

interface RestricaoModal {
  professorId: string;
  tipo: TipoRestricao;
  descricao: string;
  prioridade: PrioridadeType;
}

function StepRestricoes({ onNext }: { onNext: () => void }) {
  const [restricoes, setRestricoes] = useState<Restricao[]>(restricoesMock);
  const [search, setSearch] = useState('');
  const [profFilter, setProfFilter] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<RestricaoModal>({
    professorId: professoresMock[0].id,
    tipo: 'Carga reduzida',
    descricao: '',
    prioridade: 'Média',
  });

  const filtered = restricoes.filter(r => {
    const matchSearch = r.descricao.toLowerCase().includes(search.toLowerCase()) || r.tipo.toLowerCase().includes(search.toLowerCase());
    const matchProf = profFilter === 'Todos' || r.professorId === profFilter;
    return matchSearch && matchProf;
  });

  const openAdd = () => {
    setEditId(null);
    setForm({ professorId: professoresMock[0].id, tipo: 'Carga reduzida', descricao: '', prioridade: 'Média' });
    setShowModal(true);
  };

  const openEdit = (r: Restricao) => {
    setEditId(r.id);
    setForm({ professorId: r.professorId, tipo: r.tipo, descricao: r.descricao, prioridade: r.prioridade });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.descricao.trim()) return;
    const prof = professoresMock.find(p => p.id === form.professorId)!;
    if (editId) {
      setRestricoes(rs => rs.map(r => r.id === editId ? { ...r, ...form, professorNome: prof.nome } : r));
    } else {
      const newR: Restricao = {
        id: Date.now().toString(),
        professorId: form.professorId,
        professorNome: prof.nome,
        tipo: form.tipo,
        descricao: form.descricao,
        prioridade: form.prioridade,
        status: 'Ativa',
      };
      setRestricoes(rs => [...rs, newR]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => setRestricoes(rs => rs.filter(r => r.id !== id));

  const toggleStatus = (id: string) =>
    setRestricoes(rs => rs.map(r => r.id === id ? { ...r, status: r.status === 'Ativa' ? 'Inativa' : 'Ativa' } : r));

  const prioColors: Record<string, string> = {
    Alta: 'bg-red-100 text-red-600',
    Média: 'bg-amber-100 text-amber-700',
    Baixa: 'bg-sky-100 text-sky-600',
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-gray-800 mb-1">Restrições e preferências</h2>
          <p className="text-gray-500 text-sm">Defina restrições de cada professor antes de iniciar a simulação.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={14} />
          Adicionar restrição
        </motion.button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar professor ou tipo..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F]"
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
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50/60">
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
                  className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center text-[9px] font-bold text-[#2D6A4F]">
                        {r.professorNome.split(' ').map(n => n[0]).slice(0, 2).join('')}
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
                        r.status === 'Ativa' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {r.status}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(r)} className="p-1 text-gray-400 hover:text-[#2D6A4F] transition-colors">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
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
          <div className="p-8 text-center text-gray-400 text-sm">Nenhuma restrição encontrada</div>
        )}
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">{restricoes.length} restrição(ões) no total</p>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onNext}
        className="flex items-center gap-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
      >
        Continuar para simulação
        <ChevronRight size={15} />
      </motion.button>

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
                  {editId ? 'Editar restrição' : 'Nova restrição'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Professor</label>
                  <select
                    value={form.professorId}
                    onChange={e => setForm(f => ({ ...f, professorId: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 bg-white"
                  >
                    {professoresMock.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Tipo de restrição</label>
                  <select
                    value={form.tipo}
                    onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoRestricao }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 bg-white"
                  >
                    {tiposRestricao.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Descrição <span className="text-red-500">*</span></label>
                  <textarea
                    value={form.descricao}
                    onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                    placeholder="Descreva a restrição ou preferência..."
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 resize-none bg-white"
                  />
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
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  Cancelar
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  disabled={!form.descricao.trim()}
                  className="px-4 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] disabled:bg-gray-200 text-white disabled:text-gray-400 text-sm font-medium rounded-lg transition-colors"
                >
                  {editId ? 'Salvar alterações' : 'Adicionar'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Step 4: Simulação ────────────────────────────────────────────────────────

import { alocacoesMock } from '../data/mockData';

type SimStatus = 'idle' | 'processing' | 'done';

function StepSimulacao({ onFinish, semestreNome }: { onFinish: () => void; semestreNome: string }) {
  const [status, setStatus] = useState<SimStatus>('idle');
  const [progress, setProgress] = useState(0);

  const startProcessing = () => {
    setStatus('processing');
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setStatus('done');
          return 100;
        }
        return p + Math.random() * 8 + 2;
      });
    }, 120);
  };

  const compatibilidadeMedia = Math.round(alocacoesMock.reduce((a, al) => a + al.compatibilidade, 0) / alocacoesMock.length);

  const compColor = (v: number) => v >= 90 ? 'text-emerald-600' : v >= 80 ? 'text-amber-600' : 'text-red-500';
  const compBg = (v: number) => v >= 90 ? 'bg-emerald-100' : v >= 80 ? 'bg-amber-100' : 'bg-red-100';

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-gray-800 mb-1">Simulação</h2>
        <p className="text-gray-500 text-sm">
          Para consolidar a simulação com os dados configurados e encontrar as melhores combinações de professores e disciplinas.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Semestres', value: '1', sub: 'Selecionado', icon: '📅' },
          { label: 'Vagas disponíveis', value: '2', sub: 'Turmas abertas', icon: '📋' },
          { label: 'Professores', value: `${professoresMock.length}`, sub: 'Aptos para alocação', icon: '👩‍🏫' },
        ].map(({ label, value, sub, icon }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <span className="text-2xl">{icon}</span>
            <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
            <p className="text-xs font-medium text-gray-700">{label}</p>
            <p className="text-[10px] text-gray-400">{sub}</p>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center"
          >
            <div className="w-16 h-16 bg-[#F0FDF4] rounded-full flex items-center justify-center mx-auto mb-4">
              <Play size={24} className="text-[#2D6A4F] ml-1" />
            </div>
            <h3 className="text-gray-800 mb-2">Gerar possibilidades</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              O algoritmo vai analisar as restrições, preferências e disponibilidade de cada professor para sugerir as melhores combinações.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6 text-left max-w-sm mx-auto">
              {[
                'Compatibilidade professor/disciplina',
                'Distribuição horária balanceada',
                'Restrições e preferências respeitadas',
                'Carga horária dos professores',
              ].map(item => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle2 size={13} className="text-[#2D6A4F] mt-0.5 shrink-0" />
                  <span className="text-xs text-gray-500">{item}</span>
                </div>
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={startProcessing}
              className="flex items-center gap-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors mx-auto"
            >
              <Play size={15} />
              Iniciar processamento
            </motion.button>
          </motion.div>
        )}

        {status === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="w-14 h-14 border-4 border-gray-100 border-t-[#2D6A4F] rounded-full mx-auto mb-4"
            />
            <h3 className="text-gray-800 mb-2">Processando simulação...</h3>
            <p className="text-sm text-gray-500 mb-5">Analisando restrições e gerando combinações otimizadas</p>
            <div className="max-w-xs mx-auto">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Progresso</span>
                <span>{Math.min(100, Math.round(progress))}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="bg-[#2D6A4F] h-full rounded-full"
                  animate={{ width: `${Math.min(100, progress)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="mt-3 space-y-1.5">
                {[
                  { label: 'Carregando restrições', done: progress > 25 },
                  { label: 'Calculando compatibilidade', done: progress > 55 },
                  { label: 'Otimizando distribuição', done: progress > 80 },
                  { label: 'Gerando relatório final', done: progress >= 100 },
                ].map(({ label, done }) => (
                  <div key={label} className="flex items-center gap-2 text-left">
                    {done
                      ? <CheckCircle2 size={12} className="text-[#2D6A4F] shrink-0" />
                      : <div className="w-3 h-3 rounded-full border-2 border-gray-200 shrink-0" />
                    }
                    <span className={`text-[11px] ${done ? 'text-[#2D6A4F]' : 'text-gray-400'}`}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {status === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-4 flex items-center gap-3 mb-5">
              <CheckCircle2 size={18} className="text-[#2D6A4F] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#1B4332]">Simulação concluída com sucesso!</p>
                <p className="text-xs text-[#2D6A4F]">
                  {alocacoesMock.length} alocações geradas · Compatibilidade média: {compatibilidadeMedia}%
                </p>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
                <p className="text-2xl font-bold text-[#2D6A4F]">{compatibilidadeMedia}%</p>
                <p className="text-xs text-gray-500 mt-0.5">Compatibilidade média</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
                <p className="text-2xl font-bold text-[#2D6A4F]">{alocacoesMock.length}</p>
                <p className="text-xs text-gray-500 mt-0.5">Disciplinas alocadas</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
                <p className="text-2xl font-bold text-amber-500">0</p>
                <p className="text-xs text-gray-500 mt-0.5">Restrições violadas</p>
              </div>
            </div>

            {/* Allocations table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-5">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Alocações geradas</span>
                <span className="text-xs text-[#2D6A4F] font-medium">{alocacoesMock.length} registros</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/40">
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5">Professor</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5">Disciplina</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5">Turno</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-4 py-2.5">Compatibilidade</th>
                  </tr>
                </thead>
                <tbody>
                  {alocacoesMock.map((al, i) => (
                    <motion.tr
                      key={al.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs font-medium text-gray-700">{al.professorNome}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-[200px] truncate">{al.disciplinaNome}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{al.turno}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${compBg(al.compatibilidade)} ${compColor(al.compatibilidade)}`}>
                          {al.compatibilidade}%
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onFinish}
                className="flex items-center gap-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                <CheckCircle2 size={15} />
                Finalizar e salvar
              </motion.button>
              <button
                onClick={() => setStatus('idle')}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Executar nova simulação
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Wizard Orchestrator ───────────────────────────────────────────────────────

const stepTitles = ['Novo Semestre', 'Oferta do Semestre', 'Restrições e Preferências', 'Simulação'];

export function WizardView({ step, onStep, onFinish, onCancel, semestreId }: WizardViewProps) {
  const [semestreData, setSemestreData] = useState({
    nome: '',
    codigo: '',
    dataInicio: '',
    dataFim: '',
    observacoes: '',
  });
  const [selectedDisciplinas, setSelectedDisciplinas] = useState<string[]>([]);

  const handleSemestreNext = (data: typeof semestreData) => {
    setSemestreData(data);
    onStep(1);
  };

  return (
    <div className="min-h-full bg-gray-50" style={{ fontFamily: 'Manrope, sans-serif' }}>
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button onClick={onCancel} className="hover:text-gray-700 transition-colors">Semestres</button>
          <ChevronRight size={13} className="text-gray-300" />
          <span className="text-gray-700 font-medium">{stepTitles[step]}</span>
        </div>
        <button
          onClick={onCancel}
          className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
        >
          <X size={13} />
          Cancelar
        </button>
      </div>

      {/* Content */}
      <div className="p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && <StepSemestre onNext={handleSemestreNext} initialData={semestreData} />}
            {step === 1 && (
              <StepOferta
                onNext={() => onStep(2)}
                selectedIds={selectedDisciplinas}
                onSelectionChange={setSelectedDisciplinas}
              />
            )}
            {step === 2 && <StepRestricoes onNext={() => onStep(3)} />}
            {step === 3 && <StepSimulacao onFinish={onFinish} semestreNome={semestreData.nome} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
