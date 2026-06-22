import { useState } from 'react';
import { Plus, Search, ChevronRight, Calendar, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { semestresMock, type Semestre, type StatusSemestre } from '../data/mockData';

interface SemestresViewProps {
  onNewSemestre: () => void;
  onEditSemestre: (id: string) => void;
}

const statusLabel: Record<string, string> = {
  ativo: 'Em andamento',
  planejamento: 'Planejamento',
  'concluído': 'Concluído',
};

const statusColors: Record<string, string> = {
  ativo: 'bg-emerald-100 text-emerald-700',
  planejamento: 'bg-amber-100 text-amber-700',
  'concluído': 'bg-gray-100 text-gray-500',
};

export function SemestresView({ onNewSemestre, onEditSemestre }: SemestresViewProps) {
  const [semestres, setSemestres] = useState<Semestre[]>(semestresMock);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');

  const filtered = semestres.filter(s => {
    const matchSearch = s.nome.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'Todos' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = (id: string) => setSemestres(s => s.filter(sem => sem.id !== id));

  return (
    <div className="p-8" style={{ fontFamily: 'Manrope, sans-serif' }}>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-gray-800">Semestres</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie os semestres letivos e seus processos de alocação.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewSemestre}
          className="flex items-center gap-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={15} />
          Novo semestre
        </motion.button>
      </motion.div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar semestre..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F] bg-white"
          />
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {['Todos', 'ativo', 'planejamento', 'concluído'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-[#2D6A4F] text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s === 'Todos' ? 'Todos' : statusLabel[s]}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-center p-5 gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] flex items-center justify-center shrink-0">
                  <Calendar size={18} className="text-[#2D6A4F]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-gray-800 font-semibold">{s.nome}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColors[s.status]}`}>
                      {statusLabel[s.status]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{s.dataInicio} – {s.dataFim}</p>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700">{s.totalDisciplinas}</p>
                    <p className="text-[10px] text-gray-400">Disciplinas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700">{s.alocacoesRealizadas}</p>
                    <p className="text-[10px] text-gray-400">Alocadas</p>
                  </div>
                  <div className="w-28">
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                      <span>Progresso</span>
                      <span>{s.progresso}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        className="bg-[#2D6A4F] h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${s.progresso}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEditSemestre(s.id)}
                      className="p-2 text-gray-400 hover:text-[#2D6A4F] hover:bg-[#F0FDF4] rounded-lg transition-all"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <ChevronRight
                    size={15}
                    className="text-gray-300 group-hover:text-[#2D6A4F] transition-colors cursor-pointer"
                    onClick={() => onEditSemestre(s.id)}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Calendar size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum semestre encontrado</p>
            <button
              onClick={onNewSemestre}
              className="mt-3 text-[#2D6A4F] text-sm font-medium hover:text-[#1B4332] transition-colors"
            >
              Criar novo semestre
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
