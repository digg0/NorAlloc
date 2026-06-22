import { LayoutDashboard, CalendarDays, BookOpen, Users, AlertTriangle, Activity, BarChart3, Check, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export type View = 'dashboard' | 'semestres' | 'disciplinas' | 'professores' | 'restricoes' | 'wizard';

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  isWizard: boolean;
  wizardStep: number;
  onWizardStep: (step: number) => void;
}

const navItems = [
  { id: 'dashboard' as View, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'semestres' as View, label: 'Semestres', icon: CalendarDays },
  { id: 'disciplinas' as View, label: 'Disciplinas', icon: BookOpen },
  { id: 'professores' as View, label: 'Professores', icon: Users },
  { id: 'restricoes' as View, label: 'Restrições', icon: AlertTriangle },
];

const wizardSteps = [
  { label: 'Semestre', desc: 'Dados básicos' },
  { label: 'Ofertas', desc: 'Selecionar disciplinas' },
  { label: 'Restrições', desc: 'Configurar restrições' },
  { label: 'Simulação', desc: 'Gerar alocações' },
];

export function Sidebar({ currentView, onNavigate, isWizard, wizardStep, onWizardStep }: SidebarProps) {
  return (
    <aside className="w-56 bg-[#1B4332] flex flex-col h-full shrink-0" style={{ fontFamily: 'Manrope, sans-serif' }}>
      {/* Brand */}
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0">
            <span className="text-[#1B4332] font-bold text-sm">A</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Allocat</p>
            <p className="text-white/50 text-[11px]">Campus Tauá</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {isWizard ? (
          <div>
            <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest px-2 mb-3">Novo Semestre</p>
            <div className="space-y-1">
              {wizardSteps.map(({ label, desc }, index) => {
                const isDone = wizardStep > index;
                const isActive = wizardStep === index;
                const isLocked = wizardStep < index;
                return (
                  <button
                    key={index}
                    onClick={() => isDone && onWizardStep(index)}
                    disabled={isLocked}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                      isActive
                        ? 'bg-white/15 cursor-default'
                        : isDone
                        ? 'hover:bg-white/10 cursor-pointer'
                        : 'cursor-not-allowed opacity-40'
                    }`}
                  >
                    <motion.span
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold border-2 transition-colors ${
                        isActive
                          ? 'bg-white border-white text-[#1B4332]'
                          : isDone
                          ? 'bg-[#52B788] border-[#52B788] text-white'
                          : 'border-white/30 text-white/40'
                      }`}
                      initial={false}
                    >
                      {isDone ? <Check size={12} /> : index + 1}
                    </motion.span>
                    <div>
                      <p className={`text-sm font-medium leading-tight ${isActive ? 'text-white' : isDone ? 'text-white/80' : 'text-white/40'}`}>
                        {label}
                      </p>
                      <p className={`text-[10px] leading-tight ${isActive ? 'text-white/60' : 'text-white/30'}`}>{desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <button
                onClick={() => onNavigate('dashboard')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/5 transition-all text-sm"
              >
                <ArrowLeft size={14} />
                Voltar ao início
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-0.5">
            <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest px-2 mb-3">Menu</p>
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  currentView === id
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-white/65 hover:text-white hover:bg-white/10'
                }`}
              >
                {currentView === id && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute left-3 w-0.5 h-5 bg-[#52B788] rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
                <Icon size={16} />
                {label}
              </button>
            ))}

            <div className="mt-4 pt-4 border-t border-white/10">
              <button
                onClick={() => onNavigate('semestres' as View)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 text-white/65 hover:text-white hover:bg-white/10`}
              >
                <BarChart3 size={16} />
                Relatórios
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-7 h-7 rounded-full bg-[#52B788] flex items-center justify-center text-white text-xs font-bold shrink-0">
            LS
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">Laura Silva</p>
            <p className="text-white/45 text-[10px]">Coordenadora</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
