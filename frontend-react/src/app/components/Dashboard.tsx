import { useState } from 'react';
import { CalendarDays, BookOpen, Users, ChevronRight, Plus, Lightbulb, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { semestresMock, disciplinasMock, professoresMock, type Semestre } from '../data/mockData';

interface DashboardProps {
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

function SemestreCard({ s, onEdit }: { s: Semestre; onEdit: () => void }) {
  return (
    <motion.div
      whileHover={{ x: 2 }}
      className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group cursor-pointer"
      onClick={onEdit}
    >
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 rounded-lg bg-[#F0FDF4] flex items-center justify-center shrink-0">
          <CalendarDays size={16} className="text-[#2D6A4F]" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-gray-800">{s.nome}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColors[s.status]}`}>
              {statusLabel[s.status]}
            </span>
          </div>
          <p className="text-xs text-gray-400">{s.dataInicio} – {s.dataFim}</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-xs text-gray-400 mb-1.5">
            {s.alocacoesRealizadas}/{s.totalDisciplinas} alocações
          </p>
          <div className="w-28 bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="bg-[#2D6A4F] h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${s.progresso}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            />
          </div>
        </div>
        <ChevronRight size={15} className="text-gray-300 group-hover:text-[#2D6A4F] transition-colors" />
      </div>
    </motion.div>
  );
}

export function Dashboard({ onNewSemestre, onEditSemestre }: DashboardProps) {
  const kpis = [
    { label: 'Semestres ativos', value: semestresMock.filter(s => s.status === 'ativo').length, sub: 'Em andamento', icon: CalendarDays },
    { label: 'Total de disciplinas', value: disciplinasMock.length, sub: 'Cadastradas no sistema', icon: BookOpen },
    { label: 'Total de professores', value: professoresMock.length, sub: 'Professores ativos', icon: Users },
  ];

  return (
    <div className="p-8 max-w-4xl" style={{ fontFamily: 'Manrope, sans-serif' }}>
      {/* Header */}
      <motion.div
        className="flex items-start justify-between mb-8"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-gray-800 mb-1">Olá, Laura! 👋</h1>
          <p className="text-gray-500 text-sm">Aqui está o panorama atual do sistema de alocação acadêmica.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewSemestre}
          className="flex items-center gap-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={15} />
          Definir novo processo
        </motion.button>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {kpis.map(({ label, value, sub, icon: Icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.07 }}
            className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-[#F0FDF4] rounded-lg flex items-center justify-center">
                <Icon size={17} className="text-[#2D6A4F]" />
              </div>
              <span className="text-xs text-gray-500">{label}</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
            <p className="text-[11px] text-gray-400 mt-1">{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Semesters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h3 className="text-gray-700 text-sm">Semestres recentes</h3>
          <button className="text-xs text-[#2D6A4F] hover:text-[#1B4332] font-medium transition-colors">
            Ver todos
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {semestresMock.map(s => (
            <SemestreCard key={s.id} s={s} onEdit={() => onEditSemestre(s.id)} />
          ))}
        </div>
      </motion.div>

      {/* Tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="flex items-start gap-3 p-4 bg-[#F0FDF4] rounded-xl border border-[#BBF7D0]"
      >
        <Lightbulb size={16} className="text-[#2D6A4F] mt-0.5 shrink-0" />
        <p className="text-xs text-[#1B4332] leading-relaxed">
          Use o wizard de novo semestre para configurar de forma guiada as etapas do fluxo de alocação — de disciplinas e restrições à simulação final.
        </p>
        <button
          onClick={onNewSemestre}
          className="ml-auto text-xs text-[#2D6A4F] font-medium whitespace-nowrap hover:text-[#1B4332] transition-colors flex items-center gap-1 shrink-0"
        >
          Ver relatórios <Activity size={12} />
        </button>
      </motion.div>
    </div>
  );
}
