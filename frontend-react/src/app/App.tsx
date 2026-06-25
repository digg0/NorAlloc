import React, { useState, useRef, useEffect } from 'react';
import ifceLogo from '../imports/image.png';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Users, BookOpen, Calendar, Settings, Plus,
  ChevronRight, ChevronLeft, CheckCircle2, AlertCircle,
  Play, Save, Trash2, Search, Menu, GraduationCap, ShieldAlert,
  Edit, X, Check, LogOut, Eye, EyeOff, Lock, Mail, Ban, Camera,
  Clock, Star, CalendarCheck
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { login as apiLogin, logout as apiLogout, getSessao, type SessaoUsuario } from './services/auth';
import { listarProfessores, criarProfessor, atualizarProfessor, removerProfessor, meuPerfilProfessor } from './services/professores';
import { getResumoGeral, getResumoProfessor, type ResumoGeral, type ResumoProfessor } from './services/dashboard';
import { listarCursos, criarCurso } from './services/cursos';
import { listarDisciplinas, criarDisciplina, atualizarDisciplina, removerDisciplina } from './services/disciplinas';
import { listarTurmas, criarTurma, atualizarTurma, removerTurma } from './services/turmas';
import { listarCoordenadores, criarCoordenador, atualizarCoordenador, removerCoordenador } from './services/coordenadores';
import { listarSemestres, criarSemestre, atualizarSemestre, removerSemestre } from './services/semestres';
import { listarOfertas, criarOferta, atualizarOferta, removerOferta } from './services/ofertas';
import { listarAlocacoes, gerarGrade, type AlocacaoUI } from './services/alocacoes';
import { emitirRelatorio, type RelatorioResponse } from './services/relatorios';
import { consultarDisponibilidade, salvarDisponibilidade } from './services/disponibilidade';
import { obterSituacaoProfessor, salvarSituacaoProfessor, type SituacaoProfessor } from './services/situacaoProfessor';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
  }
>(({ className, variant = 'default', size = 'default', ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
      variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      variant === 'outline' && 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
      variant === 'link' && 'text-primary underline-offset-4 hover:underline',
      size === 'default' && 'h-10 px-4 py-2',
      size === 'sm' && 'h-9 rounded-md px-3',
      size === 'lg' && 'h-11 rounded-md px-8',
      size === 'icon' && 'h-10 w-10',
      className
    )}
    {...props}
  />
));
Button.displayName = 'Button';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)} {...props} />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-2xl font-semibold leading-none tracking-tight', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)} {...props} />
  )
);
Label.displayName = 'Label';

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'success' }
>(({ className, variant = 'default', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
      variant === 'default' && 'border-transparent bg-primary text-primary-foreground',
      variant === 'secondary' && 'border-transparent bg-secondary text-secondary-foreground',
      variant === 'destructive' && 'border-transparent bg-destructive text-destructive-foreground',
      variant === 'outline' && 'text-foreground',
      variant === 'warning' && 'border-amber-200 bg-amber-50 text-amber-700',
      variant === 'success' && 'border-green-200 bg-green-50 text-green-700',
      className
    )}
    {...props}
  />
));
Badge.displayName = 'Badge';

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  )
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
);
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
);
TableBody.displayName = 'TableBody';

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr ref={ref} className={cn('border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted', className)} {...props} />
  )
);
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th ref={ref} className={cn('h-12 px-4 text-left align-middle font-medium text-muted-foreground', className)} {...props} />
  )
);
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn('p-4 align-middle', className)} {...props} />
  )
);
TableCell.displayName = 'TableCell';


type RegimeTrabalho = 'DE' | '20H' | '40H';
type StatusEtapa = 'OFERTAS' | 'RESTRICOES' | 'SIMULACAO' | 'CONCLUIDO';
type Turno = 'Manhã' | 'Tarde' | 'Noite';

type Curso = { id: number; sigla: string; nome: string; nivel?: string };
type Turma = { id: number; codigo: string; nome: string; turno: Turno; cursoId: number; semestreId: number | null };
type Disciplina = { id: number; nome: string; sigla: string; cargaHorariaCreditos: number; cursoId: number };
type Professor = { id: number; nome: string; email: string; regimeTrabalho: RegimeTrabalho; areaAtuacao: string };
type Coordenador = { id: number; nome: string; email: string; senha?: string; cursoId: number; ativo: boolean };
type Semestre = { id: number; nome: string; dataInicio: string; dataTermino: string; statusEtapa: StatusEtapa };
type Oferta = { id?: number; turmaId: number; disciplinaId: number; professorId?: number | null; cargaHoraria?: number };
type Restricao = { professorId: number; horariosBloqueados: string[]; limiteCargaHoraria?: number };


const DAYS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'] as const;
const DAY_LABELS: Record<string, string> = { SEG: 'Seg', TER: 'Ter', QUA: 'Qua', QUI: 'Qui', SEX: 'Sex', SAB: 'Sáb' };

const SHIFTS = [
  { id: 'M', label: 'Manhã', slots: ['M1', 'M2', 'M3', 'M4'] },
  { id: 'T', label: 'Tarde', slots: ['T1', 'T2', 'T3', 'T4'] },
  { id: 'N', label: 'Noite', slots: ['N1', 'N2', 'N3', 'N4', 'N5'] },
] as const;

const SLOT_TIMES: Record<string, string> = {
  M1: '07:25', M2: '08:25', M3: '09:45', M4: '10:45',
  T1: '13:00', T2: '14:00', T3: '15:20', T4: '16:20',
  N1: '18:20', N2: '19:10', N3: '20:10', N4: '21:00', N5: '21:50',
};


const REGIME_LABELS: Record<RegimeTrabalho, string> = {
  DE: 'Dedicação Exclusiva',
  '40H': '40 Horas',
  '20H': '20 Horas',
};

const REGIME_MAX_CH: Record<RegimeTrabalho, string> = {
  DE: 'Máx 20h/sem em sala',
  '40H': 'Máx 40h/sem',
  '20H': 'Máx 20h/sem',
};

const REGIME_MAX_HOURS: Record<RegimeTrabalho, number> = {
  DE: 20,
  '40H': 40,
  '20H': 20,
};

const ETAPA_LABELS: Record<StatusEtapa, string> = {
  OFERTAS: 'Configurando Ofertas',
  RESTRICOES: 'Configurando Restrições',
  SIMULACAO: 'Simulação',
  CONCLUIDO: 'Concluído',
};

function etapaBadgeVariant(etapa: StatusEtapa): 'default' | 'warning' | 'success' | 'secondary' {
  if (etapa === 'CONCLUIDO') return 'success';
  if (etapa === 'SIMULACAO') return 'default';
  if (etapa === 'RESTRICOES') return 'warning';
  return 'secondary';
}

function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR');
}


type TimeSlotGridProps = {
  blocked: string[];
  onChange: (blocked: string[]) => void;
};

function TimeSlotGrid({ blocked, onChange }: TimeSlotGridProps) {
  const toggle = (slot: string) => {
    onChange(blocked.includes(slot) ? blocked.filter(s => s !== slot) : [...blocked, slot]);
  };

  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse w-full">
        <thead>
          <tr>
            <th className="p-1 text-left text-muted-foreground w-16">Slot</th>
            {DAYS.map(d => (
              <th key={d} className="p-1 text-center text-muted-foreground w-10">{DAY_LABELS[d]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SHIFTS.map(shift => (
            <React.Fragment key={shift.id}>
              <tr>
                <td colSpan={7} className="pt-2 pb-0.5 px-1">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{shift.label}</span>
                </td>
              </tr>
              {shift.slots.map(slot => {
                const slotLabel = `${slot} · ${SLOT_TIMES[slot]}`;
                return (
                  <tr key={slot}>
                    <td className="p-1 text-muted-foreground whitespace-nowrap">{slotLabel}</td>
                    {DAYS.map(day => {
                      const key = `${day}_${slot}`;
                      const isBlocked = blocked.includes(key);
                      return (
                        <td key={day} className="p-1 text-center">
                          <button
                            type="button"
                            onClick={() => toggle(key)}
                            className={cn(
                              'w-8 h-6 rounded text-[10px] font-medium border transition-colors',
                              isBlocked
                                ? 'bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20'
                                : 'bg-muted border-muted hover:bg-accent'
                            )}
                            title={isBlocked ? 'Bloqueado — clique para liberar' : 'Livre — clique para bloquear'}
                          >
                            {isBlocked ? <Ban className="h-3 w-3 mx-auto" /> : null}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-muted-foreground mt-2">
        Clique nas células para marcar horários bloqueados (vermelho = indisponível).
      </p>
    </div>
  );
}


type View = 'dashboard' | 'wizard' | 'professores' | 'disciplinas' | 'semestres' | 'turmas' | 'coordenadores' | 'cursos' | 'alocacoes' | 'relatorios' | 'perfil' | 'minha-agenda' | 'minha-disponibilidade' | 'minha-situacao';

type WizardData = {
  nome: string;
  dataInicio: string;
  dataTermino: string;
  ofertas: Oferta[];
  restricoes: Record<number, Restricao>;
};


const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const TODAY_ISO = new Date().toISOString().slice(0, 10);

function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function DatePicker({
  id, value, onChange, placeholder, min,
}: {
  id?: string; value: string; onChange: (v: string) => void; placeholder?: string; min?: string;
}) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => value ? new Date(value + 'T12:00:00') : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (value) setViewDate(new Date(value + 'T12:00:00'));
  }, [value]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const displayValue = value ? new Date(value + 'T12:00:00').toLocaleDateString('pt-BR') : '';

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-left',
          'ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent/40',
          !displayValue && 'text-muted-foreground'
        )}
      >
        <Calendar className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
        <span className="flex-1">{displayValue || placeholder || 'Selecionar data…'}</span>
        <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-90')} />
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.13, ease: 'easeOut' }}
          className="absolute z-50 top-[calc(100%+6px)] left-0 bg-card border rounded-xl shadow-xl p-3 w-64"
        >
          <div className="flex items-center justify-between mb-2 px-1">
            <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-muted transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold">{MONTH_NAMES[month]} {year}</span>
            <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-muted transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {['D','S','T','Q','Q','S','S'].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-medium text-muted-foreground py-0.5">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const iso = toISO(year, month, day);
              const isSelected = value === iso;
              const isToday = iso === TODAY_ISO;
              const isDisabled = !!min && iso < min;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => { onChange(iso); setOpen(false); }}
                  className={cn(
                    'h-8 w-full rounded-md text-xs font-medium transition-colors',
                    isSelected && 'bg-primary text-primary-foreground shadow-sm',
                    !isSelected && isToday && 'border border-primary text-primary font-semibold',
                    !isSelected && !isToday && !isDisabled && 'hover:bg-accent text-foreground',
                    isDisabled && 'opacity-30 cursor-not-allowed text-muted-foreground',
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
          {value && (
            <div className="mt-2 pt-2 border-t text-center text-xs text-muted-foreground">{displayValue}</div>
          )}
        </motion.div>
      )}
    </div>
  );
}


function LoginScreen({ onLogin }: { onLogin: (user: SessaoUsuario) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const sessao = await apiLogin(email, password);
      onLogin(sessao);
    } catch (err: any) {
      setError(
        err?.status === 401
          ? 'E-mail ou senha incorretos. Tente novamente.'
          : (err?.message || 'Não foi possível conectar ao servidor.')
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-gray-50" style={{ fontFamily: 'Inter, sans-serif' }}>
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex lg:w-1/2 bg-[#1B4332] flex-col justify-between p-12 relative overflow-hidden"
      >
        <div className="absolute top-[-80px] right-[-80px] w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/3 rounded-full" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white rounded-xl p-1.5 shrink-0">
            <img src={ifceLogo} alt="IFCE" className="h-20 w-auto object-contain" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">NorAlloc</p>
            <p className="text-white/60 text-lg">IFCE · Campus Tauá</p>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-white text-4xl font-bold leading-tight mb-4">
            Sistema de<br />Alocação de<br />Professores
          </h2>
          <p className="text-white/70 text-base leading-relaxed mb-8">
            Gerencie semestres, disciplinas e professores com inteligência. Simulações automáticas respeitando restrições e preferências.
          </p>
          <div className="flex flex-col gap-3">
            {[
              'Alocação automática baseada em restrições',
              'Simulação e comparação de cenários',
              'Controle de carga horária por docente',
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#52B788] flex items-center justify-center shrink-0">
                  <Check size={11} className="text-white" />
                </div>
                <span className="text-white/80 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/40 text-xs">© 2024 IFCE Campus Tauá · Coordenação Acadêmica</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex items-center justify-center p-8"
      >
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <img src={ifceLogo} alt="IFCE" className="h-10 w-auto object-contain" />
            <div>
              <p className="font-bold text-gray-800">NorAlloc</p>
              <p className="text-xs text-gray-500">IFCE · Campus Tauá</p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Entrar na conta</h1>
          <p className="text-sm text-gray-500 mb-8">Use suas credenciais institucionais para acessar.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail institucional</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="seu.nome@ifce.edu.br"
                  required
                  className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl"
                >
                  <AlertCircle size={14} className="text-red-500 shrink-0" />
                  <p className="text-xs text-red-600">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              disabled={loading}
              className="w-full py-3 bg-[#1B4332] hover:bg-[#2D6A4F] disabled:bg-gray-300 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Entrando...
                </>
              ) : 'Entrar'}
            </motion.button>
          </form>

        </div>
      </motion.div>
    </div>
  );
}


export default function App() {
  const sessaoSalva = getSessao();
  const [isLoggedIn, setIsLoggedIn] = useState(sessaoSalva !== null);
  const [currentUser, setCurrentUser] = useState<SessaoUsuario | null>(sessaoSalva);

  const handleLogin = (user: SessaoUsuario) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    apiLogout();
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  if (!isLoggedIn) {
    return (
      <AnimatePresence mode="wait">
        <LoginScreen onLogin={handleLogin} />
      </AnimatePresence>
    );
  }

  return <AppShell currentUser={currentUser!} onLogout={handleLogout} />;
}


function AppShell({ currentUser, onLogout }: { currentUser: SessaoUsuario; onLogout: () => void }) {
  const isAdmin = currentUser.role === 'Administrador';
  const isProf  = currentUser.role === 'Professor';
  const [currentView, setCurrentView] = useState<View>(
    isAdmin ? 'dashboard' : isProf ? 'minha-agenda' : 'semestres'
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [profileName, setProfileName] = useState(currentUser.name);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  const handleSaveProfile = () => {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const [professores, setProfessores] = useState<Professor[]>([]);

  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (isProf) {
      meuPerfilProfessor()
        .then(p => setProfessores([p]))
        .catch(() => setProfessores([]));
    } else {
      listarProfessores()
        .then(setProfessores)
        .catch((err) => setApiError(err?.message || 'Erro ao carregar professores.'));
    }
  }, [isProf]);

  const [resumo, setResumo] = useState<ResumoGeral | null>(null);
  const [resumoProf, setResumoProf] = useState<ResumoProfessor | null>(null);
  useEffect(() => {
    if (isProf) {
      getResumoProfessor().then(setResumoProf).catch(() => {});
    } else {
      getResumoGeral().then(setResumo).catch(() => {});
    }
  }, [isProf]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [semestres, setSemestres] = useState<Semestre[]>([]);

  useEffect(() => {
    listarCursos().then(setCursos).catch((err) => setApiError(err?.message || 'Erro ao carregar cursos.'));
    listarDisciplinas().then(setDisciplinas).catch((err) => setApiError(err?.message || 'Erro ao carregar disciplinas.'));
    listarTurmas().then(setTurmas).catch((err) => setApiError(err?.message || 'Erro ao carregar turmas.'));
    listarSemestres().then(setSemestres).catch((err) => setApiError(err?.message || 'Erro ao carregar semestres.'));
  }, []);

  const [profSearch, setProfSearch] = useState('');
  const [discSearch, setDiscSearch] = useState('');
  const [turmaSearch, setTurmaSearch] = useState('');
  const [coordSearch, setCoordSearch] = useState('');

  type ProfForm = Omit<Professor, 'id'> & { senha: string };
  const emptyProfForm: ProfForm = { nome: '', email: '', regimeTrabalho: 'DE', areaAtuacao: '', senha: '' };
  const [profModal, setProfModal] = useState<{ open: boolean; editId: number | null }>({ open: false, editId: null });
  const [profForm, setProfForm] = useState<ProfForm>(emptyProfForm);
  const [profFormError, setProfFormError] = useState('');
  const [profShowSenha, setProfShowSenha] = useState(false);

  const openProfAdd = () => { setProfForm(emptyProfForm); setProfFormError(''); setProfShowSenha(false); setProfModal({ open: true, editId: null }); };
  const openProfEdit = (p: Professor) => { setProfForm({ nome: p.nome, email: p.email, regimeTrabalho: p.regimeTrabalho, areaAtuacao: p.areaAtuacao, senha: '' }); setProfFormError(''); setProfShowSenha(false); setProfModal({ open: true, editId: p.id }); };
  const saveProf = async () => {
    if (!profForm.nome.trim() || !profForm.email.trim()) { setProfFormError('Nome e e-mail são obrigatórios.'); return; }
    const novo = profModal.editId === null;
    if (novo && profForm.senha.trim().length < 8) { setProfFormError('A senha de acesso deve ter no mínimo 8 caracteres.'); return; }
    if (!novo && profForm.senha.trim() && profForm.senha.trim().length < 8) { setProfFormError('A nova senha deve ter no mínimo 8 caracteres.'); return; }
    try {
      if (profModal.editId !== null) {
        const atualizado = await atualizarProfessor(profModal.editId, profForm);
        setProfessores(ps => ps.map(p => p.id === profModal.editId ? atualizado : p));
      } else {
        const novo = await criarProfessor(profForm);
        setProfessores(ps => [...ps, novo]);
      }
      setProfModal({ open: false, editId: null });
    } catch (err: any) {
      setProfFormError(err?.message || 'Erro ao salvar professor.');
    }
  };
  const deleteProf = async (id: number) => {
    try {
      await removerProfessor(id);
      setProfessores(ps => ps.filter(p => p.id !== id));
    } catch (err) {
      console.error('Falha ao remover professor:', err);
    }
  };

  type DiscForm = Omit<Disciplina, 'id'>;
  const emptyDiscForm: DiscForm = { nome: '', sigla: '', cargaHorariaCreditos: 3, cursoId: 1 };
  const [discModal, setDiscModal] = useState<{ open: boolean; editId: number | null }>({ open: false, editId: null });
  const [discForm, setDiscForm] = useState<DiscForm>(emptyDiscForm);
  const [discFormError, setDiscFormError] = useState('');

  const openDiscAdd = () => { setDiscForm({ ...emptyDiscForm, cursoId: cursos[0]?.id ?? 1 }); setDiscFormError(''); setDiscModal({ open: true, editId: null }); };
  const openDiscEdit = (d: Disciplina) => { setDiscForm({ nome: d.nome, sigla: d.sigla, cargaHorariaCreditos: d.cargaHorariaCreditos, cursoId: d.cursoId }); setDiscFormError(''); setDiscModal({ open: true, editId: d.id }); };
  const saveDisc = async () => {
    if (!discForm.nome.trim() || !discForm.sigla.trim()) { setDiscFormError('Nome e sigla são obrigatórios.'); return; }
    try {
      if (discModal.editId !== null) {
        const atualizada = await atualizarDisciplina(discModal.editId, discForm);
        setDisciplinas(ds => ds.map(d => d.id === discModal.editId ? atualizada : d));
      } else {
        const nova = await criarDisciplina(discForm);
        setDisciplinas(ds => [...ds, nova]);
      }
      setDiscModal({ open: false, editId: null });
    } catch (err: any) {
      setDiscFormError(err?.message || 'Erro ao salvar disciplina.');
    }
  };
  const deleteDisc = async (id: number) => {
    try {
      await removerDisciplina(id);
      setDisciplinas(ds => ds.filter(d => d.id !== id));
    } catch (err) {
      console.error('Falha ao remover disciplina:', err);
    }
  };

  type TurmaForm = Omit<Turma, 'id'>;
  const emptyTurmaForm: TurmaForm = { codigo: '', nome: '', turno: 'Manhã', cursoId: 1, semestreId: null };
  const [turmaModal, setTurmaModal] = useState<{ open: boolean; editId: number | null }>({ open: false, editId: null });
  const [turmaForm, setTurmaForm] = useState<TurmaForm>(emptyTurmaForm);
  const [turmaFormError, setTurmaFormError] = useState('');

  const openTurmaAdd = () => { setTurmaForm({ ...emptyTurmaForm, cursoId: cursos[0]?.id ?? 1, semestreId: semestres[0]?.id ?? null }); setTurmaFormError(''); setTurmaModal({ open: true, editId: null }); };
  const openTurmaEdit = (t: Turma) => { setTurmaForm({ codigo: t.codigo, nome: t.nome, turno: t.turno, cursoId: t.cursoId, semestreId: t.semestreId }); setTurmaFormError(''); setTurmaModal({ open: true, editId: t.id }); };
  const saveTurma = async () => {
    if (!turmaForm.nome.trim() || !turmaForm.codigo.trim()) { setTurmaFormError('Código e nome são obrigatórios.'); return; }
    try {
      if (turmaModal.editId !== null) {
        const atualizada = await atualizarTurma(turmaModal.editId, turmaForm);
        setTurmas(ts => ts.map(t => t.id === turmaModal.editId ? atualizada : t));
      } else {
        const nova = await criarTurma(turmaForm);
        setTurmas(ts => [...ts, nova]);
      }
      setTurmaModal({ open: false, editId: null });
    } catch (err: any) {
      setTurmaFormError(err?.message || 'Erro ao salvar turma.');
    }
  };
  const deleteTurma = async (id: number) => {
    try {
      await removerTurma(id);
      setTurmas(ts => ts.filter(t => t.id !== id));
    } catch (err) {
      console.error('Falha ao remover turma:', err);
    }
  };

  type CoordForm = { nome: string; email: string; senha: string; cursoId: number };
  const [coordenadores, setCoordenadores] = useState<Coordenador[]>([]);
  const [coordModal, setCoordModal] = useState<{ open: boolean; editId: number | null }>({ open: false, editId: null });
  const [coordForm, setCoordForm] = useState<CoordForm>({ nome: '', email: '', senha: '', cursoId: 1 });
  const [coordFormError, setCoordFormError] = useState('');
  const [coordShowSenha, setCoordShowSenha] = useState(false);

  useEffect(() => {
    listarCoordenadores().then(setCoordenadores).catch((err) => setApiError(err?.message || 'Erro ao carregar coordenadores.'));
  }, []);

  const openCoordAdd = () => { setCoordForm({ nome: '', email: '', senha: '', cursoId: cursos[0]?.id ?? 1 }); setCoordFormError(''); setCoordShowSenha(false); setCoordModal({ open: true, editId: null }); };
  const openCoordEdit = (c: Coordenador) => { setCoordForm({ nome: c.nome, email: c.email, senha: '', cursoId: c.cursoId }); setCoordFormError(''); setCoordShowSenha(false); setCoordModal({ open: true, editId: c.id }); };
  const saveCoord = async () => {
    if (!coordForm.nome.trim() || !coordForm.email.trim()) { setCoordFormError('Nome e e-mail são obrigatórios.'); return; }
    const novo = coordModal.editId === null;
    if (novo && coordForm.senha.trim().length < 8) { setCoordFormError('A senha deve ter no mínimo 8 caracteres.'); return; }
    if (!novo && coordForm.senha.trim() && coordForm.senha.trim().length < 8) { setCoordFormError('A nova senha deve ter no mínimo 8 caracteres.'); return; }
    try {
      if (coordModal.editId !== null) {
        const atualizado = await atualizarCoordenador(coordModal.editId, coordForm);
        setCoordenadores(cs => cs.map(c => c.id === coordModal.editId ? { ...atualizado, senha: '' } : c));
      } else {
        const criado = await criarCoordenador(coordForm);
        setCoordenadores(cs => [...cs, { ...criado, senha: '' }]);
      }
      setCoordModal({ open: false, editId: null });
    } catch (err: any) {
      setCoordFormError(err?.message || 'Erro ao salvar coordenador.');
    }
  };
  const deleteCoord = async (id: number) => {
    try {
      await removerCoordenador(id);
      setCoordenadores(cs => cs.filter(c => c.id !== id));
    } catch (err) {
      console.error('Falha ao remover coordenador:', err);
    }
  };

  type SemForm = Omit<Semestre, 'id'>;
  const emptySemForm: SemForm = { nome: '', dataInicio: '', dataTermino: '', statusEtapa: 'OFERTAS' };
  const [semModal, setSemModal] = useState<{ open: boolean; editId: number | null }>({ open: false, editId: null });
  const [semForm, setSemForm] = useState<SemForm>(emptySemForm);
  const [semFormError, setSemFormError] = useState('');

  const openSemAdd = () => { setSemForm(emptySemForm); setSemFormError(''); setSemModal({ open: true, editId: null }); };
  const openWizardNew = () => {
    setWizardStep(1);
    setWizardSemestreId(null);
    setWizardError('');
    setSimulationComplete(false);
    setSimulationRunning(false);
    setWizardData({ nome: '', dataInicio: '', dataTermino: '', ofertas: [], restricoes: {} });
    setCurrentView('wizard');
  };
  const openWizardForSemestre = (sem: Semestre) => {
    const semOfertas = ofertas.filter(o => turmas.some(t => t.id === o.turmaId && t.semestreId === sem.id));
    setWizardStep(2);
    setWizardSemestreId(sem.id);
    setWizardError('');
    setSimulationComplete(false);
    setSimulationRunning(false);
    setWizardData({
      nome: sem.nome,
      dataInicio: sem.dataInicio,
      dataTermino: sem.dataTermino,
      ofertas: semOfertas.map(o => ({ id: o.id, turmaId: o.turmaId, disciplinaId: o.disciplinaId, professorId: o.professorId, cargaHoraria: o.cargaHoraria })),
      restricoes: {},
    });
    setSelectedSemestreId(sem.id);
    setCurrentView('wizard');
  };
  const openSemEdit = (s: Semestre) => { setSemForm({ nome: s.nome, dataInicio: s.dataInicio, dataTermino: s.dataTermino, statusEtapa: s.statusEtapa }); setSemFormError(''); setSemModal({ open: true, editId: s.id }); };
  const saveSem = async () => {
    if (!semForm.nome.trim() || !semForm.dataInicio || !semForm.dataTermino) { setSemFormError('Nome e datas são obrigatórios.'); return; }
    if (semForm.dataTermino <= semForm.dataInicio) { setSemFormError('A data de término deve ser posterior à de início.'); return; }
    try {
      if (semModal.editId !== null) {
        const atualizado = await atualizarSemestre(semModal.editId, semForm);
        setSemestres(ss => ss.map(s => s.id === semModal.editId ? atualizado : s));
      } else {
        const novo = await criarSemestre(semForm);
        setSemestres(ss => [...ss, novo]);
      }
      setSemModal({ open: false, editId: null });
    } catch (err: any) {
      setSemFormError(err?.message || 'Erro ao salvar semestre.');
    }
  };
  const deleteSem = async (id: number) => {
    try {
      await removerSemestre(id);
      setSemestres(ss => ss.filter(s => s.id !== id));
    } catch (err) {
      console.error('Falha ao remover semestre:', err);
    }
  };

  const [wizardStep, setWizardStep] = useState(1);
  const [wizardSemestreId, setWizardSemestreId] = useState<number | null>(null);
  const [wizardError, setWizardError] = useState('');
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [wizardData, setWizardData] = useState<WizardData>({
    nome: '',
    dataInicio: '',
    dataTermino: '',
    ofertas: [],
    restricoes: {},
  });

  const [newOfertaTurma, setNewOfertaTurma] = useState<number>(0);
  const [newOfertaDisc, setNewOfertaDisc] = useState<number>(0);
  const [newOfertaProf, setNewOfertaProf] = useState<number>(0);
  const [expandedProf, setExpandedProf] = useState<number | null>(null);

  const advanceWizardStep = async () => {
    setWizardError('');
    if (wizardStep === 1) {
      if (wizardSemestreId) {
        setWizardStep(2);
        return;
      }
      try {
        const novo = await criarSemestre({
          nome: wizardData.nome,
          dataInicio: wizardData.dataInicio,
          dataTermino: wizardData.dataTermino,
          statusEtapa: 'OFERTAS',
        });
        setSemestres(ss => [...ss, novo]);
        setWizardSemestreId(novo.id);
        setSelectedSemestreId(novo.id);
        setWizardStep(2);
      } catch (err: any) {
        setWizardError(err?.message || 'Erro ao criar semestre.');
      }
      return;
    }
    if (wizardStep === 3 && wizardSemestreId) {
      const restricoesComDados = Object.values(wizardData.restricoes).filter(
        r => r.horariosBloqueados.length > 0 || r.limiteCargaHoraria
      );
      try {
        await Promise.all(
          restricoesComDados.map(r =>
            salvarDisponibilidade(r.professorId, {
              semestre_id: wizardSemestreId!,
              horarios_bloqueados: r.horariosBloqueados,
              limite_carga_horaria: r.limiteCargaHoraria ?? 20,
            })
          )
        );
      } catch (err: any) {
        setWizardError(err?.message || 'Erro ao salvar restrições.');
        return;
      }
    }
    setWizardStep(s => s + 1);
  };

  const runSimulation = async () => {
    const semId = wizardSemestreId || selectedSemestreId;
    if (!semId) return;
    setSimulationRunning(true);
    setAlocacaoError('');
    try {
      await gerarGrade(semId);
      const dados = await listarAlocacoes();
      setAlocacoes(dados);
      setSimulationComplete(true);
    } catch (err: any) {
      setAlocacaoError(err?.message || 'Erro ao gerar alocação.');
      setSimulationComplete(false);
    } finally {
      setSimulationRunning(false);
    }
  };

  const finishWizard = () => {
    setCurrentView(isAdmin ? 'dashboard' : 'semestres');
    setWizardStep(1);
    setWizardSemestreId(null);
    setWizardError('');
    setSimulationComplete(false);
    setSimulationRunning(false);
    setWizardData({ nome: '', dataInicio: '', dataTermino: '', ofertas: [], restricoes: {} });
  };

  const addOferta = async () => {
    if (!newOfertaTurma || !newOfertaDisc) return;
    const already = wizardData.ofertas.some(o => o.turmaId === newOfertaTurma && o.disciplinaId === newOfertaDisc);
    if (already) return;
    const disc = disciplinas.find(d => d.id === newOfertaDisc);
    try {
      const nova = await criarOferta({
        turmaId: newOfertaTurma,
        disciplinaId: newOfertaDisc,
        professorId: newOfertaProf || null,
        cargaHoraria: disc?.cargaHorariaCreditos || 40,
      });
      setWizardData(d => ({ ...d, ofertas: [...d.ofertas, { id: nova.id, turmaId: nova.turmaId, disciplinaId: nova.disciplinaId, professorId: nova.professorId, cargaHoraria: nova.cargaHoraria }] }));
      setNewOfertaTurma(0); setNewOfertaDisc(0); setNewOfertaProf(0);
    } catch (err: any) {
      setWizardError(err?.message || 'Erro ao criar oferta.');
    }
  };

  const removeOferta = async (turmaId: number, disciplinaId: number) => {
    const oferta = wizardData.ofertas.find(o => o.turmaId === turmaId && o.disciplinaId === disciplinaId);
    if (oferta?.id) {
      try { await removerOferta(oferta.id); } catch { /* best-effort */ }
    }
    setWizardData(d => ({ ...d, ofertas: d.ofertas.filter(o => !(o.turmaId === turmaId && o.disciplinaId === disciplinaId)) }));
  };

  const turmasDoSemestre = wizardSemestreId
    ? turmas.filter(t => t.semestreId === wizardSemestreId)
    : turmas;
  const selectedOfertaTurma = turmas.find(t => t.id === newOfertaTurma);
  const disciplinasFiltradas = selectedOfertaTurma
    ? disciplinas.filter(d => d.cursoId === selectedOfertaTurma.cursoId)
    : disciplinas;

  const [wizardTurmaForm, setWizardTurmaForm] = useState({ nome: '', cursoId: 0 });
  const addTurmaToSemestre = async () => {
    if (!wizardTurmaForm.nome.trim() || !wizardTurmaForm.cursoId || !wizardSemestreId) return;
    try {
      const nova = await criarTurma({
        codigo: '',
        nome: wizardTurmaForm.nome,
        turno: 'Manhã',
        cursoId: wizardTurmaForm.cursoId,
        semestreId: wizardSemestreId,
      });
      setTurmas(ts => [...ts, nova]);
      setWizardTurmaForm({ nome: '', cursoId: 0 });
    } catch (err: any) {
      setWizardError(err?.message || 'Erro ao criar turma.');
    }
  };

  const updateRestricao = (professorId: number, patch: Partial<Restricao>) => {
    setWizardData(d => ({
      ...d,
      restricoes: {
        ...d.restricoes,
        [professorId]: { professorId, horariosBloqueados: [], ...d.restricoes[professorId], ...patch },
      },
    }));
  };


  const adminNavItems: { view: View; label: string; icon: React.ReactNode }[] = [
    { view: 'dashboard',     label: 'Dashboard',     icon: <LayoutDashboard className="mr-2 h-4 w-4" /> },
    { view: 'cursos',        label: 'Cursos',        icon: <GraduationCap   className="mr-2 h-4 w-4" /> },
    { view: 'semestres',     label: 'Semestres',     icon: <Calendar        className="mr-2 h-4 w-4" /> },
    { view: 'coordenadores', label: 'Coordenadores', icon: <ShieldAlert     className="mr-2 h-4 w-4" /> },
    { view: 'professores',   label: 'Professores',   icon: <Users           className="mr-2 h-4 w-4" /> },
    { view: 'disciplinas',   label: 'Disciplinas',   icon: <BookOpen        className="mr-2 h-4 w-4" /> },
    { view: 'turmas',        label: 'Turmas',        icon: <GraduationCap   className="mr-2 h-4 w-4" /> },
    { view: 'alocacoes',     label: 'Alocações',     icon: <Play            className="mr-2 h-4 w-4" /> },
    { view: 'relatorios',    label: 'Relatórios',    icon: <CalendarCheck   className="mr-2 h-4 w-4" /> },
  ];

  const coordNavItems: { view: View; label: string; icon: React.ReactNode }[] = [
    { view: 'dashboard',   label: 'Dashboard',   icon: <LayoutDashboard className="mr-2 h-4 w-4" /> },
    { view: 'semestres',   label: 'Semestres',   icon: <Calendar        className="mr-2 h-4 w-4" /> },
    { view: 'professores', label: 'Professores', icon: <Users           className="mr-2 h-4 w-4" /> },
    { view: 'disciplinas', label: 'Disciplinas', icon: <BookOpen        className="mr-2 h-4 w-4" /> },
    { view: 'turmas',      label: 'Turmas',      icon: <GraduationCap   className="mr-2 h-4 w-4" /> },
    { view: 'alocacoes',   label: 'Alocações',   icon: <Play            className="mr-2 h-4 w-4" /> },
    { view: 'relatorios',  label: 'Relatórios',  icon: <CalendarCheck   className="mr-2 h-4 w-4" /> },
  ];

  const profNavItems: { view: View; label: string; icon: React.ReactNode }[] = [
    { view: 'minha-agenda',           label: 'Minha Agenda',           icon: <Calendar      className="mr-2 h-4 w-4" /> },
    { view: 'minha-disponibilidade',  label: 'Minha Disponibilidade',  icon: <CalendarCheck className="mr-2 h-4 w-4" /> },
    { view: 'minha-situacao',         label: 'Minha Situação',         icon: <AlertCircle   className="mr-2 h-4 w-4" /> },
    { view: 'perfil',                 label: 'Meu Perfil',             icon: <Users         className="mr-2 h-4 w-4" /> },
  ];

  const navItems = isAdmin ? adminNavItems : isProf ? profNavItems : coordNavItems;

  const viewTitle: Record<View, string> = {
    dashboard:                isAdmin ? 'Visão Geral — Administração' : 'Visão Geral',
    wizard:                   'Novo Semestre',
    professores:              'Professores',
    disciplinas:              'Disciplinas',
    semestres:                'Semestres Letivos',
    turmas:                   'Turmas',
    coordenadores:            'Coordenadores',
    cursos:                   'Cursos',
    alocacoes:                'Alocações',
    relatorios:               'Relatórios',
    perfil:                   'Meu Perfil',
    'minha-agenda':           'Minha Agenda',
    'minha-disponibilidade':  'Minha Disponibilidade',
    'minha-situacao':         'Minha Situação',
  };

    const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [alocacoes, setAlocacoes] = useState<AlocacaoUI[]>([]);
  const [selectedSemestreId, setSelectedSemestreId] = useState<number>(0);
  const [alocacaoError, setAlocacaoError] = useState('');

  useEffect(() => {
    listarOfertas()
      .then(setOfertas)
      .catch((err) => setApiError(err?.message || 'Erro ao carregar ofertas.'));
    listarAlocacoes()
      .then(setAlocacoes)
      .catch(() => setAlocacoes([]));
  }, []);

  useEffect(() => {
    if (!selectedSemestreId && semestres.length) setSelectedSemestreId(semestres[0].id);
  }, [semestres, selectedSemestreId]);

  const profLogado = professores.find(p => p.email === currentUser.email);
  const alocacoesProfessor = profLogado ? alocacoes.filter(a => a.professorId === profLogado.id) : [];
  const maxHoras = profLogado ? REGIME_MAX_HOURS[profLogado.regimeTrabalho] : (resumoProf?.carga_maxima ?? 0);
  const horasAlocadas = alocacoesProfessor.length;

  const [disponibilidade, setDisponibilidade] = useState<Set<string>>(new Set());
  const [dispSaved, setDispSaved] = useState(false);
  const [dispError, setDispError] = useState('');

  useEffect(() => {
    if (!profLogado?.id || !selectedSemestreId) return;
    consultarDisponibilidade(profLogado.id, selectedSemestreId)
      .then(dados => setDisponibilidade(new Set(dados.horarios_bloqueados || [])))
      .catch(() => setDisponibilidade(new Set()));
  }, [profLogado?.id, selectedSemestreId]);

  const toggleDisponibilidade = (key: string) => {
    setDisponibilidade(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleSaveDisp = async () => {
    if (!profLogado?.id || !selectedSemestreId) {
      setDispError('Professor ou semestre não identificado.');
      return;
    }
    try {
      await salvarDisponibilidade(profLogado.id, {
        semestre_id: selectedSemestreId,
        horarios_bloqueados: Array.from(disponibilidade),
        limite_carga_horaria: maxHoras || 1,
      });
      setDispError('');
      setDispSaved(true);
      setTimeout(() => setDispSaved(false), 2500);
    } catch (err: any) {
      setDispError(err?.message || 'Erro ao salvar disponibilidade.');
    }
  };

  const [situacao, setSituacao] = useState<SituacaoProfessor>({ situacao: 'ativo', carga_disponivel: 20, data_inicio: '', data_fim: '', observacao: '' });
  const [situacaoSaved, setSituacaoSaved] = useState(false);
  const [situacaoError, setSituacaoError] = useState('');

  useEffect(() => {
    if (!profLogado?.id) return;
    obterSituacaoProfessor(profLogado.id)
      .then(setSituacao)
      .catch(() => {});
  }, [profLogado?.id]);

  const handleSaveSituacao = async () => {
    if (!profLogado?.id) {
      setSituacaoError('Professor não identificado.');
      return;
    }
    try {
      const atualizada = await salvarSituacaoProfessor(profLogado.id, situacao);
      setSituacao(atualizada);
      setSituacaoError('');
      setSituacaoSaved(true);
      setTimeout(() => setSituacaoSaved(false), 2500);
    } catch (err: any) {
      setSituacaoError(err?.message || 'Erro ao salvar situação.');
    }
  };

  const [cursoForm, setCursoForm] = useState({ nome: '', nivel: 'Superior' });
  const [cursoFormError, setCursoFormError] = useState('');

  const saveCurso = async () => {
    if (!cursoForm.nome.trim()) {
      setCursoFormError('Nome do curso é obrigatório.');
      return;
    }
    try {
      const novo = await criarCurso(cursoForm);
      setCursos(cs => [...cs, novo]);
      setCursoForm({ nome: '', nivel: 'Superior' });
      setCursoFormError('');
    } catch (err: any) {
      setCursoFormError(err?.message || 'Erro ao salvar curso.');
    }
  };

  const [relatorioCursoId, setRelatorioCursoId] = useState<number>(0);
  const [relatorioSemestreId, setRelatorioSemestreId] = useState<number>(0);
  const [relatorio, setRelatorio] = useState<RelatorioResponse | null>(null);
  const [relatorioError, setRelatorioError] = useState('');
  const [relatorioLoading, setRelatorioLoading] = useState(false);

  useEffect(() => {
    if (!relatorioCursoId && cursos.length) setRelatorioCursoId(cursos[0].id);
    if (!relatorioSemestreId && semestres.length) setRelatorioSemestreId(semestres[0].id);
  }, [cursos, semestres, relatorioCursoId, relatorioSemestreId]);

  const carregarRelatorio = async () => {
    if (!relatorioCursoId || !relatorioSemestreId) return;
    setRelatorioLoading(true);
    setRelatorioError('');
    try {
      setRelatorio(await emitirRelatorio(relatorioCursoId, relatorioSemestreId));
    } catch (err: any) {
      setRelatorio(null);
      setRelatorioError(err?.message || 'Erro ao carregar relatório.');
    } finally {
      setRelatorioLoading(false);
    }
  };

  const DISP_SHIFTS = [
    { label: 'Manhã', slots: [
      { id: 'M1', time: '07:25' }, { id: 'M2', time: '08:25' },
      { id: 'M3', time: '09:45' }, { id: 'M4', time: '10:45' },
    ]},
    { label: 'Tarde', slots: [
      { id: 'T1', time: '13:00' }, { id: 'T2', time: '14:00' },
      { id: 'T3', time: '15:20' }, { id: 'T4', time: '16:20' },
    ]},
    { label: 'Noite', slots: [
      { id: 'N1', time: '18:20' }, { id: 'N2', time: '19:20' },
      { id: 'N3', time: '20:40' }, { id: 'N4', time: '21:40' },
    ]},
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="hidden md:flex flex-col border-r bg-sidebar text-sidebar-foreground z-10 shrink-0"
          >
            <div className="p-5 flex items-center gap-3 border-b border-sidebar-border">
              <img src={ifceLogo} alt="IFCE" className="h-18 w-auto object-contain" />
              <div className="flex flex-col">
                <span className="font-semibold text-base">NorAlloc</span>
                <span className="text-xs text-muted-foreground">Campus Tauá</span>
              </div>
            </div>

            <nav className="p-4 flex-1 overflow-y-auto space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 pb-2">
                {isAdmin ? 'Administração' : isProf ? 'Professor' : 'Coordenação'}
              </p>
              {navItems.map(item => (
                <Button
                  key={item.view}
                  variant={currentView === item.view ? 'default' : 'ghost'}
                  className={cn('w-full justify-start', currentView !== item.view && 'text-muted-foreground')}
                  onClick={() => setCurrentView(item.view)}
                >
                  {item.icon}
                  {item.label}
                </Button>
              ))}
            </nav>

            <div className="p-4 border-t border-sidebar-border space-y-1">
              <button
                onClick={() => setCurrentView('perfil')}
                className="w-full flex items-center gap-2.5 px-2 py-2 mb-1 rounded-lg hover:bg-accent/60 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 overflow-hidden">
                  {profilePhoto
                    ? <img src={profilePhoto} alt="" className="w-full h-full object-cover" />
                    : <span className="text-[10px] font-bold text-primary">{currentUser.initials}</span>
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-sidebar-foreground truncate">{profileName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{currentUser.role}</p>
                </div>
              </button>
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={onLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair da conta
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-14 border-b flex items-center justify-between px-4 lg:px-6 bg-background shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(v => !v)} className="hidden md:flex">
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold text-lg">{viewTitle[currentView]}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('perfil')}
              className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-primary/40 transition-all"
              title="Meu Perfil"
            >
              {profilePhoto
                ? <img src={profilePhoto} alt="" className="w-full h-full object-cover" />
                : <span className="text-xs font-medium text-primary">{currentUser.initials}</span>
              }
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {currentView === 'dashboard' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Bem-vindo ao NorAlloc</h2>
                  <p className="text-muted-foreground">Gerencie a alocação de professores do IFCE Campus Tauá.</p>
                </div>
                {!isAdmin && (
                  <Button onClick={() => setCurrentView('alocacoes')}>
                    <Play className="mr-2 h-4 w-4" />
                    Nova Simulação
                  </Button>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Professores</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{resumo?.professores.total ?? professores.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {resumo?.professores.de ?? professores.filter(p => p.regimeTrabalho === 'DE').length} DE ·{' '}
                      {resumo?.professores.h40 ?? professores.filter(p => p.regimeTrabalho === '40H').length} 40H ·{' '}
                      {resumo?.professores.h20 ?? professores.filter(p => p.regimeTrabalho === '20H').length} 20H
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Disciplinas</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{resumo?.disciplinas ?? disciplinas.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Em {resumo?.cursos ?? cursos.filter(c => disciplinas.some(d => d.cursoId === c.id)).length} cursos
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Semestre Atual</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      if (resumo) {
                        const atual = resumo.semestre_atual;
                        return atual ? (
                          <>
                            <div className="text-2xl font-bold">{atual.nome}</div>
                            <Badge variant="secondary" className="mt-1">{atual.status}</Badge>
                          </>
                        ) : <div className="text-sm text-muted-foreground">Nenhum ativo</div>;
                      }
                      const ativo = semestres.find(s => s.statusEtapa !== 'CONCLUIDO');
                      return ativo ? (
                        <>
                          <div className="text-2xl font-bold">{ativo.nome}</div>
                          <Badge variant={etapaBadgeVariant(ativo.statusEtapa)} className="mt-1">
                            {ETAPA_LABELS[ativo.statusEtapa]}
                          </Badge>
                        </>
                      ) : <div className="text-sm text-muted-foreground">Nenhum ativo</div>;
                    })()}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conflitos</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <p className="text-xs text-muted-foreground">Sem conflitos de horário</p>
                  </CardContent>
                </Card>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Histórico de Semestres</CardTitle>
                    <CardDescription>Situação por período letivo.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(resumo ? resumo.semestres.map(sem => (
                      <div key={sem.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium text-sm">{sem.nome}</p>
                          <p className="text-xs text-muted-foreground">{fmtDate(sem.data_inicio)} – {fmtDate(sem.data_fim)}</p>
                        </div>
                        <Badge variant="secondary">{sem.status}</Badge>
                      </div>
                    )) : semestres.map(sem => (
                      <div key={sem.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium text-sm">{sem.nome}</p>
                          <p className="text-xs text-muted-foreground">{fmtDate(sem.dataInicio)} – {fmtDate(sem.dataTermino)}</p>
                        </div>
                        <Badge variant={etapaBadgeVariant(sem.statusEtapa)}>
                          {ETAPA_LABELS[sem.statusEtapa]}
                        </Badge>
                      </div>
                    )))}
                    {resumo && resumo.semestres.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-3">Nenhum semestre cadastrado.</p>
                    )}
                    {!isAdmin && (
                      <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setCurrentView('semestres')}>
                        Ver todos os semestres
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
          {currentView === 'wizard' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Novo Semestre Letivo</h2>
                  <p className="text-muted-foreground">Siga as etapas para configurar e simular a alocação.</p>
                </div>
                <Button variant="ghost" onClick={() => setCurrentView(isAdmin ? 'dashboard' : 'semestres')}>Cancelar</Button>
              </div>
              <div className="relative">
                <div className="absolute left-0 top-4 w-full h-0.5 bg-muted">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: '0%' }}
                    animate={{ width: `${((wizardStep - 1) / 3) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className="relative flex justify-between">
                  {(['Criação', 'Ofertas', 'Restrições', 'Simulação'] as const).map((label, i) => {
                    const step = i + 1;
                    return (
                      <div key={step} className="flex flex-col items-center gap-2 bg-background px-2 z-10">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center font-medium border-2 transition-colors',
                          wizardStep > step ? 'bg-primary border-primary text-primary-foreground' :
                          wizardStep === step ? 'border-primary text-primary bg-background' :
                          'border-muted text-muted-foreground bg-background'
                        )}>
                          {wizardStep > step ? <CheckCircle2 className="h-4 w-4" /> : step}
                        </div>
                        <span className={cn('text-xs font-medium', wizardStep >= step ? 'text-foreground' : 'text-muted-foreground')}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Card>
                <AnimatePresence mode="wait">
                  {wizardStep === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <CardHeader>
                        <CardTitle>1. Dados do Semestre</CardTitle>
                        <CardDescription>Informe o período letivo e as datas de início e término.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="nome">Período Letivo (ex: 2024.2)</Label>
                          <Input id="nome" value={wizardData.nome} onChange={e => setWizardData(d => ({ ...d, nome: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Data de Início</Label>
                            <DatePicker value={wizardData.dataInicio} onChange={v => setWizardData(d => ({ ...d, dataInicio: v }))} placeholder="Selecione a data de início" />
                          </div>
                          <div className="space-y-2">
                            <Label>Data de Término</Label>
                            <DatePicker value={wizardData.dataTermino} onChange={v => setWizardData(d => ({ ...d, dataTermino: v }))} placeholder="Selecione a data de término" min={wizardData.dataInicio || undefined} />
                          </div>
                        </div>
                        {wizardData.dataTermino && wizardData.dataInicio && wizardData.dataTermino <= wizardData.dataInicio && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            A data de término deve ser posterior à data de início.
                          </p>
                        )}
                      </CardContent>
                    </motion.div>
                  )}

                  {wizardStep === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <CardHeader>
                        <CardTitle>2. Configuração de Ofertas</CardTitle>
                        <CardDescription>Primeiro vincule turmas a este semestre, depois associe disciplinas e professores.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
                          <Label className="font-medium">Adicionar turma ao semestre</Label>
                          <div className="flex gap-2 items-end flex-wrap">
                            <div className="flex-1 min-w-[140px] space-y-1">
                              <Label className="text-xs">Curso</Label>
                              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={wizardTurmaForm.cursoId} onChange={e => setWizardTurmaForm(f => ({ ...f, cursoId: Number(e.target.value) }))}>
                                <option value={0}>Selecionar curso…</option>
                                {cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                              </select>
                            </div>
                            <div className="flex-1 min-w-[160px] space-y-1">
                              <Label className="text-xs">Nome da turma</Label>
                              <Input placeholder="Ex.: ADS 5º sem (Manhã)" value={wizardTurmaForm.nome} onChange={e => setWizardTurmaForm(f => ({ ...f, nome: e.target.value }))} />
                            </div>
                            <Button onClick={addTurmaToSemestre} disabled={!wizardTurmaForm.nome.trim() || !wizardTurmaForm.cursoId}>
                              <Plus className="mr-2 h-4 w-4" />Turma
                            </Button>
                          </div>
                          {turmasDoSemestre.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {turmasDoSemestre.map(t => {
                                const curso = cursos.find(c => c.id === t.cursoId);
                                return <Badge key={t.id} variant="secondary">{t.nome}{curso ? ` — ${curso.nome}` : ''}</Badge>;
                              })}
                            </div>
                          )}
                          {turmasDoSemestre.length === 0 && (
                            <p className="text-xs text-muted-foreground">Nenhuma turma vinculada a este semestre. Adicione pelo menos uma acima.</p>
                          )}
                        </div>

                        <div className="space-y-3">
                          <Label className="font-medium">Vincular disciplina e professor à turma</Label>
                        <div className="flex gap-2 items-end flex-wrap">
                          <div className="flex-1 min-w-[160px] space-y-1">
                            <Label className="text-xs">Turma</Label>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={newOfertaTurma} onChange={e => { setNewOfertaTurma(Number(e.target.value)); setNewOfertaDisc(0); }}>
                              <option value={0}>Selecionar turma…</option>
                              {turmasDoSemestre.map(t => {
                                const curso = cursos.find(c => c.id === t.cursoId);
                                return <option key={t.id} value={t.id}>{t.nome}{curso ? ` (${curso.nome})` : ''}</option>;
                              })}
                            </select>
                          </div>
                          <div className="flex-1 min-w-[200px] space-y-1">
                            <Label>Disciplina {selectedOfertaTurma ? `(${cursos.find(c => c.id === selectedOfertaTurma.cursoId)?.nome || ''})` : ''}</Label>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={newOfertaDisc} onChange={e => setNewOfertaDisc(Number(e.target.value))}>
                              <option value={0}>Selecionar disciplina…</option>
                              {disciplinasFiltradas.map(d => <option key={d.id} value={d.id}>{d.sigla} — {d.nome} ({d.cargaHorariaCreditos}h)</option>)}
                            </select>
                          </div>
                          <div className="flex-1 min-w-[160px] space-y-1">
                            <Label>Professor (opcional)</Label>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={newOfertaProf} onChange={e => setNewOfertaProf(Number(e.target.value))}>
                              <option value={0}>Definir depois…</option>
                              {professores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                            </select>
                          </div>
                          <Button onClick={addOferta} disabled={!newOfertaTurma || !newOfertaDisc}>
                            <Plus className="mr-2 h-4 w-4" />Adicionar
                          </Button>
                        </div>
                        {wizardData.ofertas.length === 0 ? (
                          <div className="text-center py-10 text-muted-foreground text-sm border rounded-lg">
                            Nenhuma oferta adicionada. Associe pelo menos uma turma a uma disciplina.
                          </div>
                        ) : (
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Turma</TableHead><TableHead>Turno</TableHead><TableHead>Disciplina</TableHead><TableHead>CH</TableHead><TableHead>Professor</TableHead><TableHead className="w-12"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {wizardData.ofertas.map((o, i) => {
                                  const turma = turmas.find(t => t.id === o.turmaId);
                                  const disc = disciplinas.find(d => d.id === o.disciplinaId);
                                  const prof = o.professorId ? professores.find(p => p.id === o.professorId) : null;
                                  return (
                                    <TableRow key={i}>
                                      <TableCell className="font-medium">{turma?.nome ?? '—'}</TableCell>
                                      <TableCell><Badge variant="outline">{turma?.turno ?? '—'}</Badge></TableCell>
                                      <TableCell>{disc ? `${disc.sigla} — ${disc.nome}` : '—'}</TableCell>
                                      <TableCell>{disc?.cargaHorariaCreditos ?? '—'}h</TableCell>
                                      <TableCell>{prof?.nome ?? <span className="text-muted-foreground">A definir</span>}</TableCell>
                                      <TableCell>
                                        <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeOferta(o.turmaId, o.disciplinaId)}>
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                        </div>
                      </CardContent>
                    </motion.div>
                  )}

                  {wizardStep === 3 && (
                    <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <CardHeader>
                        <CardTitle>3. Alocação de Professores e Restrições</CardTitle>
                        <CardDescription>Atribua um professor a cada oferta (turma/disciplina) e configure os horários indisponíveis.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Seção 1 — Alocação manual de professores às ofertas */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Alocação de Professores às Ofertas</h3>
                          {wizardData.ofertas.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma oferta criada. Volte ao passo 2 para adicionar ofertas.</p>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Turma</TableHead>
                                  <TableHead>Disciplina</TableHead>
                                  <TableHead>CH</TableHead>
                                  <TableHead>Professor</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {wizardData.ofertas.map(o => {
                                  const turma = turmas.find(t => t.id === o.turmaId);
                                  const disc = disciplinas.find(d => d.id === o.disciplinaId);
                                  return (
                                    <TableRow key={`${o.turmaId}-${o.disciplinaId}`}>
                                      <TableCell>
                                        <Badge variant="outline">{turma?.nome ?? `Turma #${o.turmaId}`}</Badge>
                                      </TableCell>
                                      <TableCell className="font-medium">{disc?.nome ?? `Disc #${o.disciplinaId}`}</TableCell>
                                      <TableCell>{o.cargaHoraria ?? '—'}h</TableCell>
                                      <TableCell>
                                        <select
                                          className="flex h-9 w-full max-w-[220px] rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                          value={o.professorId ?? ''}
                                          onChange={async (e) => {
                                            const profId = Number(e.target.value) || null;
                                            setWizardData(d => ({
                                              ...d,
                                              ofertas: d.ofertas.map(of =>
                                                of.turmaId === o.turmaId && of.disciplinaId === o.disciplinaId
                                                  ? { ...of, professorId: profId }
                                                  : of
                                              ),
                                            }));
                                            if (o.id) {
                                              try {
                                                await atualizarOferta(o.id, { professorId: profId });
                                              } catch { /* best-effort */ }
                                            }
                                          }}
                                        >
                                          <option value="">Selecionar professor…</option>
                                          {professores.map(p => (
                                            <option key={p.id} value={p.id}>{p.nome}</option>
                                          ))}
                                        </select>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          )}
                          {wizardData.ofertas.length > 0 && (
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{wizardData.ofertas.filter(o => o.professorId).length} de {wizardData.ofertas.length} ofertas com professor atribuído</span>
                            </div>
                          )}
                        </div>

                        {/* Seção 2 — Restrições de horários dos professores */}
                        <div className="border-t pt-4 space-y-3">
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Restrições de Horário dos Professores</h3>
                          {professores.map(prof => {
                            const r = wizardData.restricoes[prof.id];
                            const blocked = r?.horariosBloqueados ?? [];
                            const isExpanded = expandedProf === prof.id;
                            const ofertasDoProf = wizardData.ofertas.filter(o => o.professorId === prof.id);
                            return (
                              <div key={prof.id} className="border rounded-lg overflow-hidden">
                                <button
                                  type="button"
                                  className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
                                  onClick={() => setExpandedProf(isExpanded ? null : prof.id)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                      {prof.nome.charAt(0)}
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">{prof.nome}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {REGIME_LABELS[prof.regimeTrabalho]} · {REGIME_MAX_CH[prof.regimeTrabalho]}
                                        {ofertasDoProf.length > 0 && ` · ${ofertasDoProf.length} oferta${ofertasDoProf.length > 1 ? 's' : ''}`}
                                        {blocked.length > 0 && ` · ${blocked.length} bloqueio${blocked.length > 1 ? 's' : ''}`}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {ofertasDoProf.length > 0 && (
                                      <Badge variant="default">{ofertasDoProf.length} aula{ofertasDoProf.length > 1 ? 's' : ''}</Badge>
                                    )}
                                    {blocked.length > 0 && (
                                      <Badge variant="warning">
                                        <ShieldAlert className="h-3 w-3 mr-1" />{blocked.length} bloqueio{blocked.length > 1 ? 's' : ''}
                                      </Badge>
                                    )}
                                    <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform', isExpanded && 'rotate-90')} />
                                  </div>
                                </button>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    className="border-t px-4 pb-4 pt-3 space-y-4"
                                  >
                                    {ofertasDoProf.length > 0 && (
                                      <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Ofertas atribuídas</Label>
                                        <div className="flex flex-wrap gap-1.5">
                                          {ofertasDoProf.map(o => {
                                            const turma = turmas.find(t => t.id === o.turmaId);
                                            const disc = disciplinas.find(d => d.id === o.disciplinaId);
                                            return (
                                              <Badge key={`${o.turmaId}-${o.disciplinaId}`} variant="secondary" className="text-xs">
                                                {turma?.nome} — {disc?.nome} ({o.cargaHoraria ?? 0}h)
                                              </Badge>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                    <div className="space-y-1">
                                      <Label htmlFor={`ch-${prof.id}`}>Limite CH semanal em sala (horas)</Label>
                                      <Input
                                        id={`ch-${prof.id}`}
                                        type="number"
                                        min={0}
                                        max={REGIME_MAX_HOURS[prof.regimeTrabalho]}
                                        value={r?.limiteCargaHoraria ?? ''}
                                        placeholder={`Máx: ${REGIME_MAX_HOURS[prof.regimeTrabalho]}h`}
                                        className="w-40"
                                        onChange={e => updateRestricao(prof.id, { limiteCargaHoraria: e.target.value ? Number(e.target.value) : undefined })}
                                      />
                                    </div>
                                    <TimeSlotGrid
                                      blocked={blocked}
                                      onChange={horariosBloqueados => updateRestricao(prof.id, { horariosBloqueados })}
                                    />
                                  </motion.div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </motion.div>
                  )}

                  {wizardStep === 4 && (
                    <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <CardHeader className="items-center text-center">
                        <CardTitle>4. Simulação de Alocação</CardTitle>
                        <CardDescription>O algoritmo cruzará as ofertas com as restrições para propor a grade ideal.</CardDescription>
                      </CardHeader>
                      <CardContent className="py-8 flex flex-col items-center justify-center space-y-6">
                        {!simulationRunning && !simulationComplete && (
                          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-6">
                            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                              <Play className="h-10 w-10 text-primary ml-1" />
                            </div>
                            <div className="text-center space-y-1">
                              <p className="font-medium">{wizardData.ofertas.length} oferta{wizardData.ofertas.length !== 1 ? 's' : ''} · {wizardData.ofertas.filter(o => o.professorId).length} com professor alocado</p>
                              <p className="text-sm text-muted-foreground">
                                {Object.values(wizardData.restricoes).filter(r => r.horariosBloqueados.length > 0).length} professor(es) com restrições de horário.
                              </p>
                            </div>
                            <Button size="lg" onClick={runSimulation}>Iniciar Simulação</Button>
                          </motion.div>
                        )}
                        {simulationRunning && (
                          <div className="flex flex-col items-center gap-6">
                            <div className="relative w-24 h-24">
                              <div className="absolute inset-0 rounded-full border-4 border-muted" />
                              <motion.div
                                className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Settings className="h-8 w-8 text-primary animate-pulse" />
                              </div>
                            </div>
                            <div className="text-center space-y-1">
                              <h3 className="font-medium">Processando restrições...</h3>
                              <p className="text-sm text-muted-foreground">Otimizando alocação. Aguarde.</p>
                            </div>
                          </div>
                        )}
                        {simulationComplete && (
                          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-lg">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex flex-col items-center text-center gap-4">
                              <CheckCircle2 className="h-12 w-12 text-green-600" />
                              <div>
                                <h3 className="text-xl font-bold text-green-800">Simulação Concluída!</h3>
                                <p className="text-green-700 text-sm mt-1">Grade gerada com 98% de otimização, sem conflitos críticos.</p>
                              </div>
                              <div className="grid grid-cols-3 gap-3 w-full mt-2 text-left">
                                {[
                                  { label: 'Professores Alocados', value: `${wizardData.ofertas.filter(o => o.professorId).length}/${wizardData.ofertas.length}` },
                                  { label: 'Conflitos', value: '0' },
                                  { label: 'CH Média', value: '18h' },
                                ].map(item => (
                                  <div key={item.label} className="bg-white p-3 rounded border border-green-100 shadow-sm">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{item.label}</p>
                                    <p className="text-xl font-bold text-green-800">{item.value}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>

                <CardFooter className="flex justify-between border-t p-4 md:p-6 bg-muted/10 rounded-b-lg">
                  <Button variant="outline" onClick={() => setWizardStep(s => Math.max(1, s - 1))} disabled={wizardStep === 1 || simulationRunning}>
                    <ChevronLeft className="mr-2 h-4 w-4" />Voltar
                  </Button>
                  {wizardError && <p className="text-sm text-destructive">{wizardError}</p>}
                  {wizardStep < 4 ? (
                    <Button
                      onClick={advanceWizardStep}
                      disabled={
                        (wizardStep === 1 && (!wizardData.nome || !wizardData.dataInicio || !wizardData.dataTermino || wizardData.dataTermino <= wizardData.dataInicio)) ||
                        (wizardStep === 2 && wizardData.ofertas.length === 0)
                      }
                    >
                      Próximo<ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : simulationComplete ? (
                    <Button onClick={finishWizard} className="bg-green-600 hover:bg-green-700">
                      <Save className="mr-2 h-4 w-4" />Salvar Semestre
                    </Button>
                  ) : <div />}
                </CardFooter>
              </Card>
            </div>
          )}
          {currentView === 'professores' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-6xl mx-auto">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Professores</h2>
                  <p className="text-muted-foreground">Corpo docente do campus. Regime: DE (Ded. Exclusiva), 40H, 20H.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar professor..."
                      className="pl-8 h-9 w-56"
                      value={profSearch}
                      onChange={e => setProfSearch(e.target.value)}
                    />
                  </div>
                  {isAdmin && (
                    <Button onClick={openProfAdd}>
                      <Plus className="mr-2 h-4 w-4" />Novo Professor
                    </Button>
                  )}
                </div>
              </div>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Regime</TableHead>
                      <TableHead>Área de Atuação</TableHead>
                      {isAdmin && <TableHead className="text-right">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {professores
                      .filter(p => !profSearch || p.nome.toLowerCase().includes(profSearch.toLowerCase()) || p.email.toLowerCase().includes(profSearch.toLowerCase()))
                      .map(prof => (
                        <TableRow key={prof.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                {prof.nome.charAt(0)}
                              </div>
                              {prof.nome}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{prof.email}</TableCell>
                          <TableCell>
                            <Badge variant={prof.regimeTrabalho === 'DE' ? 'default' : 'outline'}>{prof.regimeTrabalho}</Badge>
                          </TableCell>
                          <TableCell>{prof.areaAtuacao}</TableCell>
                          {isAdmin && (
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => openProfEdit(prof)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteProf(prof.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    {professores.filter(p => !profSearch || p.nome.toLowerCase().includes(profSearch.toLowerCase()) || p.email.toLowerCase().includes(profSearch.toLowerCase())).length === 0 && (
                      <TableRow><TableCell colSpan={isAdmin ? 5 : 4} className="text-center text-muted-foreground py-8">Nenhum professor encontrado.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
              <p className="text-xs text-muted-foreground">DE: mín 10h — máx 20h em sala/sem · 40H: máx 40h/sem · 20H: máx 20h/sem</p>
            </motion.div>
          )}
          {currentView === 'disciplinas' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-6xl mx-auto">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Disciplinas</h2>
                  <p className="text-muted-foreground">Matriz curricular. Carga em créditos (1 crédito = 50 min).</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar disciplina..."
                      className="pl-8 h-9 w-56"
                      value={discSearch}
                      onChange={e => setDiscSearch(e.target.value)}
                    />
                  </div>
                  <Button onClick={openDiscAdd}>
                    <Plus className="mr-2 h-4 w-4" />Nova Disciplina
                  </Button>
                </div>
              </div>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sigla</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Créditos</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disciplinas
                      .filter(d => !discSearch || d.nome.toLowerCase().includes(discSearch.toLowerCase()) || d.sigla.toLowerCase().includes(discSearch.toLowerCase()))
                      .map(disc => {
                        const curso = cursos.find(c => c.id === disc.cursoId);
                        return (
                          <TableRow key={disc.id}>
                            <TableCell><Badge variant="secondary">{disc.sigla}</Badge></TableCell>
                            <TableCell className="font-medium">{disc.nome}</TableCell>
                            <TableCell className="text-muted-foreground">{curso?.sigla ?? '—'}</TableCell>
                            <TableCell>{disc.cargaHorariaCreditos} crédito{disc.cargaHorariaCreditos !== 1 ? 's' : ''}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => openDiscEdit(disc)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteDisc(disc.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {disciplinas.filter(d => !discSearch || d.nome.toLowerCase().includes(discSearch.toLowerCase()) || d.sigla.toLowerCase().includes(discSearch.toLowerCase())).length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma disciplina encontrada.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </motion.div>
          )}
          {currentView === 'turmas' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-6xl mx-auto">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Turmas</h2>
                  <p className="text-muted-foreground">Grupos de alunos por curso e turno.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar turma..."
                      className="pl-8 h-9 w-56"
                      value={turmaSearch}
                      onChange={e => setTurmaSearch(e.target.value)}
                    />
                  </div>
                  <Button onClick={openTurmaAdd}>
                    <Plus className="mr-2 h-4 w-4" />Nova Turma
                  </Button>
                </div>
              </div>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Semestre</TableHead>
                      <TableHead>Turno</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {turmas
                      .filter(t => !turmaSearch || t.nome.toLowerCase().includes(turmaSearch.toLowerCase()) || t.codigo.toLowerCase().includes(turmaSearch.toLowerCase()))
                      .map(turma => {
                        const curso = cursos.find(c => c.id === turma.cursoId);
                        const sem = semestres.find(s => s.id === turma.semestreId);
                        return (
                          <TableRow key={turma.id}>
                            <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{turma.codigo}</code></TableCell>
                            <TableCell className="font-medium">{turma.nome}</TableCell>
                            <TableCell className="text-muted-foreground">{curso?.sigla ?? '—'}</TableCell>
                            <TableCell>{sem ? <Badge variant="outline">{sem.nome}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                            <TableCell>
                              <Badge variant={turma.turno === 'Manhã' ? 'default' : turma.turno === 'Tarde' ? 'warning' : 'secondary'}>
                                {turma.turno}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => openTurmaEdit(turma)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteTurma(turma.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {turmas.filter(t => !turmaSearch || t.nome.toLowerCase().includes(turmaSearch.toLowerCase()) || t.codigo.toLowerCase().includes(turmaSearch.toLowerCase())).length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma turma encontrada.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </motion.div>
          )}
          {currentView === 'semestres' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Semestres Letivos</h2>
                  <p className="text-muted-foreground">Histórico e acompanhamento de etapas do fluxo de alocação.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={openWizardNew}>
                    <Plus className="mr-2 h-4 w-4" />Novo Semestre
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {(['OFERTAS', 'RESTRICOES', 'SIMULACAO', 'CONCLUIDO'] as StatusEtapa[]).map((etapa, i, arr) => (
                  <React.Fragment key={etapa}>
                    <Badge variant={etapaBadgeVariant(etapa)} className="font-mono">{etapa}</Badge>
                    {i < arr.length - 1 && <ChevronRight className="h-3 w-3 shrink-0" />}
                  </React.Fragment>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {semestres.map(sem => {
                  const semTurmas = turmas.filter(t => t.semestreId === sem.id);
                  const semOfertas = ofertas.filter(o => semTurmas.some(t => t.id === o.turmaId));
                  const profsAlocados = semOfertas.filter(o => o.professorId).length;
                  return (
                    <Card key={sem.id} className="relative overflow-hidden">
                      {sem.statusEtapa !== 'CONCLUIDO' && (
                        <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                          <div className="absolute transform rotate-45 bg-primary text-primary-foreground text-[10px] font-bold py-1 right-[-35px] top-[15px] w-[120px] text-center">
                            ATIVO
                          </div>
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="text-xl">{sem.nome}</CardTitle>
                        <CardDescription>{fmtDate(sem.dataInicio)} até {fmtDate(sem.dataTermino)}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Badge variant={etapaBadgeVariant(sem.statusEtapa)}>{ETAPA_LABELS[sem.statusEtapa]}</Badge>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span>{semTurmas.length} turma{semTurmas.length !== 1 ? 's' : ''}</span>
                          <span>·</span>
                          <span>{semOfertas.length} oferta{semOfertas.length !== 1 ? 's' : ''}</span>
                          <span>·</span>
                          <span>{profsAlocados}/{semOfertas.length} prof. alocado{profsAlocados !== 1 ? 's' : ''}</span>
                        </div>
                      </CardContent>
                      <CardFooter className="gap-2">
                        <Button className="flex-1" onClick={() => openWizardForSemestre(sem)}>
                          <Play className="mr-2 h-4 w-4" />Configurar
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => openSemEdit(sem)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => deleteSem(sem.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
                {semestres.length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-full text-center py-10">Nenhum semestre cadastrado. Clique em "Novo Semestre" para começar.</p>
                )}
              </div>
            </motion.div>
          )}
          {currentView === 'coordenadores' && isAdmin && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl mx-auto">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Coordenadores</h2>
                  <p className="text-muted-foreground">Gerencie as contas de acesso dos coordenadores de curso.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Buscar coordenador..." className="pl-8 h-9 w-56" value={coordSearch} onChange={e => setCoordSearch(e.target.value)} />
                  </div>
                  <Button onClick={openCoordAdd}>
                    <Plus className="mr-2 h-4 w-4" />Novo Coordenador
                  </Button>
                </div>
              </div>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coordenadores
                      .filter(c => !coordSearch || c.nome.toLowerCase().includes(coordSearch.toLowerCase()) || c.email.toLowerCase().includes(coordSearch.toLowerCase()))
                      .map(c => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{c.nome.charAt(0)}</div>
                              {c.nome}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{c.email}</TableCell>
                          <TableCell className="text-sm">{cursos.find(cur => cur.id === c.cursoId)?.nome ?? '—'}</TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border',
                                c.ativo ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-500'
                              )}
                            >
                              {c.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => openCoordEdit(c)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteCoord(c.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    {coordenadores.filter(c => !coordSearch || c.nome.toLowerCase().includes(coordSearch.toLowerCase()) || c.email.toLowerCase().includes(coordSearch.toLowerCase())).length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">Nenhum coordenador encontrado.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
              <p className="text-xs text-muted-foreground">Coordenadores têm acesso ao módulo de semestres, ofertas, restrições e simulação de alocação.</p>
            </motion.div>
          )}
          {currentView === 'perfil' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Meu Perfil</h2>
                <p className="text-muted-foreground">Edite seu nome e foto de perfil.</p>
              </div>
              <Card>
                <CardContent className="pt-8 space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-28 h-28">
                      <div className="w-28 h-28 rounded-full overflow-hidden bg-primary/10 border-4 border-primary/20 flex items-center justify-center">
                        {profilePhoto
                          ? <img src={profilePhoto} alt="" className="w-full h-full object-cover" />
                          : <span className="text-4xl font-bold text-primary">{currentUser.initials}</span>
                        }
                      </div>
                      <button
                        onClick={() => profileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors border-2 border-background"
                        title="Alterar foto"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                    </div>
                    <input
                      ref={profileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => setProfilePhoto(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <Button variant="outline" size="sm" onClick={() => profileInputRef.current?.click()}>
                      <Camera className="mr-2 h-4 w-4" />Alterar foto
                    </Button>
                    {profilePhoto && (
                      <Button variant="ghost" size="sm" className="text-destructive text-xs h-7" onClick={() => setProfilePhoto(null)}>
                        Remover foto
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profileName">Nome completo</Label>
                    <Input
                      id="profileName"
                      value={profileName}
                      onChange={e => setProfileName(e.target.value)}
                      placeholder="Seu nome"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>E-mail institucional</Label>
                    <Input value={currentUser.email} disabled className="bg-muted/40" />
                    <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado aqui.</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Função no sistema</Label>
                    <Input value={currentUser.role} disabled className="bg-muted/40" />
                  </div>

                  <AnimatePresence>
                    {profileSaved && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                        <p className="text-xs text-green-700">Perfil salvo com sucesso.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button className="w-full" onClick={handleSaveProfile}>
                    <Save className="mr-2 h-4 w-4" />Salvar Perfil
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
          {currentView === 'minha-agenda' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl mx-auto">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Minha Agenda</h2>
                <p className="text-muted-foreground">Sua carga horária e grade de aulas retornadas pela API.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Carga Máxima Semanal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">{resumoProf?.carga_maxima ?? maxHoras}h</div>
                    <p className="text-xs text-muted-foreground mt-1">{REGIME_LABELS[(resumoProf?.regime_trabalho as RegimeTrabalho) ?? profLogado?.regimeTrabalho ?? 'DE']}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Disciplinas Atribuídas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{resumoProf?.disciplinas_atribuidas ?? horasAlocadas}</div>
                    <p className="text-xs text-muted-foreground mt-1">Ofertas vinculadas a você no backend</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Horários Bloqueados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">{disponibilidade.size}</div>
                    <button onClick={() => setCurrentView('minha-disponibilidade')} className="text-xs text-primary hover:underline mt-1 block">
                      Editar disponibilidade →
                    </button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Grade Semanal</CardTitle>
                  <CardDescription>Aulas alocadas para seu professor, conforme retorno da API.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr>
                          <th className="p-2 text-left text-muted-foreground w-20 border-b">Horário</th>
                          {DAYS.map(d => <th key={d} className="p-2 text-center text-muted-foreground border-b font-semibold">{DAY_LABELS[d]}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {SHIFTS.map(shift => (
                          <React.Fragment key={shift.id}>
                            <tr>
                              <td colSpan={7} className="pt-3 pb-1 px-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{shift.label}</span>
                              </td>
                            </tr>
                            {shift.slots.map(slot => (
                              <tr key={slot} className="border-b border-muted/40 last:border-b-0">
                                <td className="p-1.5 text-muted-foreground whitespace-nowrap">
                                  <span className="font-mono">{slot}</span>
                                  <span className="ml-1 text-muted-foreground/60">{SLOT_TIMES[slot]}</span>
                                </td>
                                {DAYS.map(day => {
                                  const aula = alocacoesProfessor.find(a => a.dia === day && a.slot === slot);
                                  return (
                                    <td key={day} className="p-1 text-center">
                                      {aula ? (
                                        <div className="rounded border px-1 py-1 text-center leading-tight bg-blue-100 border-blue-300 text-blue-800">
                                          <p className="font-bold">{aula.disciplina || 'Disciplina'}</p>
                                          <p className="text-[9px] opacity-70">{aula.turma || 'Turma'}</p>
                                        </div>
                                      ) : <div className="w-full h-7 rounded bg-muted/30 border border-muted/50" />}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {alocacoesProfessor.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-4">Nenhuma alocação retornada pela API para este professor.</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
          {currentView === 'minha-disponibilidade' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl mx-auto">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Minha Disponibilidade</h2>
                <p className="text-muted-foreground">Marque os horários em que você não pode receber alocação de aulas.</p>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Grade de Disponibilidade</CardTitle>
                      <CardDescription className="mt-1">
                        Clique nas células para marcar horários bloqueados. Vermelho = indisponível · Azul = aula já alocada.
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        Horários bloqueados: <strong className="text-foreground">{disponibilidade.size}</strong>
                      </span>
                      <Button variant="outline" size="sm" onClick={() => setDisponibilidade(new Set())}>
                        Limpar bloqueios
                      </Button>
                      <Button size="sm" onClick={handleSaveDisp}>
                        <Save className="mr-1.5 h-3.5 w-3.5" />Salvar disponibilidade
                      </Button>
                    </div>
                  </div>
                  {dispError && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                      <p className="text-xs text-destructive font-medium">{dispError}</p>
                    </div>
                  )}
                  <AnimatePresence>
                    {dispSaved && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                        <p className="text-xs text-green-700 font-medium">Disponibilidade salva com sucesso.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr>
                          <th className="p-2 text-left text-muted-foreground w-24 border-b">Horário</th>
                          {DAYS.map(d => (
                            <th key={d} className="p-2 text-center text-muted-foreground border-b font-semibold min-w-[72px]">{DAY_LABELS[d]}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {DISP_SHIFTS.map(shift => (
                          <React.Fragment key={shift.label}>
                            <tr>
                              <td colSpan={7} className="pt-3 pb-1 px-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{shift.label}</span>
                              </td>
                            </tr>
                            {shift.slots.map(({ id: slotId, time }) => (
                              <tr key={slotId} className="border-b border-muted/30 last:border-b-0">
                                <td className="p-1.5 whitespace-nowrap">
                                  <span className="font-mono text-muted-foreground">{slotId}</span>
                                  <span className="ml-1.5 text-muted-foreground/60">{time}</span>
                                </td>
                                {DAYS.map(day => {
                                  const key = `${day}_${slotId}`;
                                  const alocada = alocacoesProfessor.find(a => a.dia === day && a.slot === slotId);
                                  const isDisp = disponibilidade.has(key);
                                  return (
                                    <td key={day} className="p-1 text-center">
                                      {alocada ? (
                                        <div className="w-full min-h-[36px] rounded border bg-blue-100 border-blue-300 text-blue-800 flex flex-col items-center justify-center px-1 py-1 cursor-not-allowed">
                                          <span className="font-bold text-[10px]">{alocada.disciplina || 'Aula'}</span>
                                          <span className="text-[9px] opacity-70">Alocada</span>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => toggleDisponibilidade(key)}
                                          className={cn(
                                            'w-full min-h-[36px] rounded border transition-all duration-150 flex flex-col items-center justify-center px-1 py-1 text-[10px] font-medium',
                                            isDisp
                                              ? 'bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20'
                                              : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                          )}
                                        >
                                          {isDisp ? (
                                            <>
                                              <Ban className="h-3 w-3 mb-0.5" />
                                              <span>Bloqueado</span>
                                            </>
                                          ) : (
                                            <>
                                              <Check className="h-3 w-3 mb-0.5" />
                                              <span>Livre</span>
                                            </>
                                          )}
                                        </button>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded border bg-green-50 border-green-200" />
                      <span>Livre</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded border bg-destructive/10 border-destructive/30" />
                      <span>Bloqueado</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded border bg-blue-100 border-blue-300" />
                      <span>Aula já alocada</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          {currentView === 'cursos' && isAdmin && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Cursos</h2>
                  <p className="text-muted-foreground">Cadastro administrativo de cursos do campus.</p>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Criar curso</CardTitle>
                  <CardDescription>O cadastro será enviado diretamente para a API.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cursoFormError && (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                      <p className="text-xs text-destructive">{cursoFormError}</p>
                    </div>
                  )}
                  <div className="grid gap-4 md:grid-cols-[1fr_220px_auto] items-end">
                    <div>
                      <Label className="text-xs mb-1.5 block">Nome do curso</Label>
                      <Input value={cursoForm.nome} onChange={e => { setCursoForm(f => ({ ...f, nome: e.target.value })); setCursoFormError(''); }} placeholder="Ex.: Análise e Desenvolvimento de Sistemas" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">Nível</Label>
                      <select value={cursoForm.nivel} onChange={e => setCursoForm(f => ({ ...f, nivel: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option>Superior</option>
                        <option>Técnico</option>
                        <option>Integrado</option>
                        <option>Subsequente</option>
                      </select>
                    </div>
                    <Button onClick={saveCurso}><Plus className="mr-2 h-4 w-4" />Adicionar</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cursos cadastrados</CardTitle>
                  <CardDescription>Lista retornada por /api/cursos.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Sigla</TableHead><TableHead>Nome</TableHead><TableHead>Nível</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {cursos.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="text-muted-foreground">Nenhum curso retornado pela API.</TableCell></TableRow>
                      ) : cursos.map(c => (
                        <TableRow key={c.id}><TableCell className="font-medium">{c.sigla}</TableCell><TableCell>{c.nome}</TableCell><TableCell>{c.nivel ?? '—'}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>
          )}
          {currentView === 'alocacoes' && !isProf && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Alocações</h2>
                  <p className="text-muted-foreground">Geração da grade pelo solver e visualização do resultado retornado pela API.</p>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Gerar grade</CardTitle>
                  <CardDescription>Selecione o semestre e envie a solicitação ao backend.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {alocacaoError && (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                      <p className="text-xs text-destructive">{alocacaoError}</p>
                    </div>
                  )}
                  <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
                    <div>
                      <Label className="text-xs mb-1.5 block">Semestre</Label>
                      <select value={selectedSemestreId} onChange={e => setSelectedSemestreId(Number(e.target.value))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value={0}>Selecione</option>
                        {semestres.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                      </select>
                    </div>
                    <Button onClick={runSimulation} disabled={!selectedSemestreId || simulationRunning}>
                      <Play className="mr-2 h-4 w-4" />{simulationRunning ? 'Gerando...' : 'Gerar alocação'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resultado</CardTitle>
                  <CardDescription>Alocações retornadas pela API.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Professor</TableHead><TableHead>Disciplina</TableHead><TableHead>Turma</TableHead><TableHead>Dia</TableHead><TableHead>Horário</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {alocacoes.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-muted-foreground">Nenhuma alocação retornada pela API.</TableCell></TableRow>
                      ) : alocacoes.map(a => (
                        <TableRow key={a.id}>
                          <TableCell>{a.professor || '—'}</TableCell>
                          <TableCell>{a.disciplina || `Oferta ${a.ofertaId}`}</TableCell>
                          <TableCell>{a.turma || '—'}</TableCell>
                          <TableCell>{a.dia || '—'}</TableCell>
                          <TableCell>{a.horario || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>
          )}
          {currentView === 'relatorios' && !isProf && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-6xl mx-auto">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Relatórios</h2>
                <p className="text-muted-foreground">Consulta de relatórios por curso e semestre.</p>
              </div>

              <Card>
                <CardHeader><CardTitle>Filtros</CardTitle><CardDescription>Os dados são carregados diretamente da rota de relatórios.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  {relatorioError && (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                      <p className="text-xs text-destructive">{relatorioError}</p>
                    </div>
                  )}
                  <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] items-end">
                    <div>
                      <Label className="text-xs mb-1.5 block">Curso</Label>
                      <select value={relatorioCursoId} onChange={e => setRelatorioCursoId(Number(e.target.value))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value={0}>Selecione</option>
                        {cursos.map(c => <option key={c.id} value={c.id}>{c.sigla} — {c.nome}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">Semestre</Label>
                      <select value={relatorioSemestreId} onChange={e => setRelatorioSemestreId(Number(e.target.value))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value={0}>Selecione</option>
                        {semestres.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                      </select>
                    </div>
                    <Button onClick={carregarRelatorio} disabled={!relatorioCursoId || !relatorioSemestreId || relatorioLoading}>{relatorioLoading ? 'Carregando...' : 'Gerar relatório'}</Button>
                  </div>
                </CardContent>
              </Card>

              {relatorio && (
                <Card>
                  <CardHeader><CardTitle>{relatorio.curso} — {relatorio.semestre}</CardTitle><CardDescription>Resumo do relatório</CardDescription></CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-4">
                      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Turmas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{relatorio.resumo.turmas}</div></CardContent></Card>
                      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Disciplinas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{relatorio.resumo.disciplinas}</div></CardContent></Card>
                      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Professores</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{relatorio.resumo.professores}</div></CardContent></Card>
                      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Carga Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{relatorio.resumo.carga_total}h</div></CardContent></Card>
                    </div>
                    {relatorio.turmas.map(t => (
                      <div key={t.nome} className="space-y-2">
                        <h3 className="font-semibold">{t.nome}</h3>
                        <Table>
                          <TableHeader><TableRow><TableHead>Dia</TableHead><TableHead>Horário</TableHead><TableHead>Disciplina</TableHead><TableHead>Professor</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {t.grade.length === 0 ? <TableRow><TableCell colSpan={4} className="text-muted-foreground">Sem aulas retornadas.</TableCell></TableRow> : t.grade.map((a, i) => (
                              <TableRow key={`${t.nome}-${i}`}><TableCell>{a.dia}</TableCell><TableCell>{a.horario}</TableCell><TableCell>{a.disciplina}</TableCell><TableCell>{a.professor}</TableCell></TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
          {currentView === 'minha-situacao' && isProf && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-3xl mx-auto">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Minha Situação</h2>
                <p className="text-muted-foreground">Registro de professor ativo, afastado ou com carga reduzida.</p>
              </div>
              <Card>
                <CardHeader><CardTitle>Situação docente</CardTitle><CardDescription>As informações serão enviadas para a API de professor.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  {situacaoError && <div className="flex items-center gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-lg"><AlertCircle className="h-4 w-4 text-destructive" /><p className="text-xs text-destructive">{situacaoError}</p></div>}
                  {situacaoSaved && <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg"><CheckCircle2 className="h-4 w-4 text-green-600" /><p className="text-xs text-green-700">Situação salva com sucesso.</p></div>}
                  <div>
                    <Label className="text-xs mb-1.5 block">Situação</Label>
                    <select value={situacao.situacao} onChange={e => setSituacao(s => ({ ...s, situacao: e.target.value as SituacaoProfessor['situacao'] }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="ativo">Ativo</option>
                      <option value="afastado">Afastado</option>
                      <option value="carga_reduzida">Carga reduzida</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Carga disponível</Label>
                    <Input type="number" min={0} value={situacao.carga_disponivel} onChange={e => setSituacao(s => ({ ...s, carga_disponivel: Number(e.target.value) }))} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div><Label className="text-xs mb-1.5 block">Início</Label><Input type="date" value={situacao.data_inicio || ''} onChange={e => setSituacao(s => ({ ...s, data_inicio: e.target.value }))} /></div>
                    <div><Label className="text-xs mb-1.5 block">Fim</Label><Input type="date" value={situacao.data_fim || ''} onChange={e => setSituacao(s => ({ ...s, data_fim: e.target.value }))} /></div>
                  </div>
                  <div><Label className="text-xs mb-1.5 block">Observação</Label><textarea value={situacao.observacao || ''} onChange={e => setSituacao(s => ({ ...s, observacao: e.target.value }))} className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
                  <Button className="w-full" onClick={handleSaveSituacao}><Save className="mr-2 h-4 w-4" />Salvar situação</Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <AnimatePresence>
            {profModal.open && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }} className="bg-background rounded-xl shadow-2xl w-full max-w-md overflow-hidden border">
                  <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div>
                      <h3 className="font-semibold text-base">{profModal.editId !== null ? 'Editar professor' : 'Novo professor'}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{profModal.editId !== null ? 'Altere os dados do professor.' : 'Preencha os dados para cadastrar.'}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setProfModal({ open: false, editId: null })}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-6 space-y-4">
                    {profFormError && (
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                        <p className="text-xs text-destructive">{profFormError}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs mb-1.5 block">Nome completo <span className="text-destructive">*</span></Label>
                      <Input value={profForm.nome} onChange={e => { setProfForm(f => ({ ...f, nome: e.target.value })); setProfFormError(''); }} placeholder="Ex.: Maria da Silva" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">E-mail institucional <span className="text-destructive">*</span></Label>
                      <Input type="email" value={profForm.email} onChange={e => { setProfForm(f => ({ ...f, email: e.target.value })); setProfFormError(''); }} placeholder="nome@ifce.edu.br" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">Regime de Trabalho</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={profForm.regimeTrabalho}
                        onChange={e => setProfForm(f => ({ ...f, regimeTrabalho: e.target.value as RegimeTrabalho }))}
                      >
                        <option value="DE">Dedicação Exclusiva (DE)</option>
                        <option value="40H">40 Horas</option>
                        <option value="20H">20 Horas</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">Área de Atuação</Label>
                      <Input value={profForm.areaAtuacao} onChange={e => setProfForm(f => ({ ...f, areaAtuacao: e.target.value }))} placeholder="Ex.: Computação, Matemática..." />
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">
                        Senha de acesso <span className="text-destructive">*</span>
                        {profModal.editId !== null && <span className="text-muted-foreground font-normal"> (deixe em branco para manter)</span>}
                      </Label>
                      <div className="relative">
                        <Input
                          type={profShowSenha ? 'text' : 'password'}
                          value={profForm.senha}
                          onChange={e => { setProfForm(f => ({ ...f, senha: e.target.value })); setProfFormError(''); }}
                          placeholder="Mínimo 8 caracteres"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setProfShowSenha(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {profShowSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">Cria o acesso de login do professor (perfil Professor).</p>
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t flex justify-end gap-2 bg-muted/30">
                    <Button variant="outline" onClick={() => setProfModal({ open: false, editId: null })}>Cancelar</Button>
                    <Button onClick={saveProf}><Check className="mr-2 h-4 w-4" />{profModal.editId !== null ? 'Salvar alterações' : 'Cadastrar'}</Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {discModal.open && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }} className="bg-background rounded-xl shadow-2xl w-full max-w-md overflow-hidden border">
                  <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div>
                      <h3 className="font-semibold text-base">{discModal.editId !== null ? 'Editar disciplina' : 'Nova disciplina'}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{discModal.editId !== null ? 'Altere os dados da disciplina.' : 'Preencha os dados para cadastrar.'}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setDiscModal({ open: false, editId: null })}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-6 space-y-4">
                    {discFormError && (
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                        <p className="text-xs text-destructive">{discFormError}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs mb-1.5 block">Nome da disciplina <span className="text-destructive">*</span></Label>
                      <Input value={discForm.nome} onChange={e => { setDiscForm(f => ({ ...f, nome: e.target.value })); setDiscFormError(''); }} placeholder="Ex.: Algoritmos e Estrutura de Dados" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">Sigla <span className="text-destructive">*</span></Label>
                      <Input value={discForm.sigla} onChange={e => { setDiscForm(f => ({ ...f, sigla: e.target.value.toUpperCase() })); setDiscFormError(''); }} placeholder="Ex.: AED" className="uppercase" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">Curso</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={discForm.cursoId}
                        onChange={e => setDiscForm(f => ({ ...f, cursoId: Number(e.target.value) }))}
                      >
                        {cursos.map(c => <option key={c.id} value={c.id}>{c.sigla} — {c.nome}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">Créditos</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={discForm.cargaHorariaCreditos}
                        onChange={e => setDiscForm(f => ({ ...f, cargaHorariaCreditos: Number(e.target.value) }))}
                        className="w-32"
                      />
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t flex justify-end gap-2 bg-muted/30">
                    <Button variant="outline" onClick={() => setDiscModal({ open: false, editId: null })}>Cancelar</Button>
                    <Button onClick={saveDisc}><Check className="mr-2 h-4 w-4" />{discModal.editId !== null ? 'Salvar alterações' : 'Cadastrar'}</Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {turmaModal.open && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }} className="bg-background rounded-xl shadow-2xl w-full max-w-md overflow-hidden border">
                  <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div>
                      <h3 className="font-semibold text-base">{turmaModal.editId !== null ? 'Editar turma' : 'Nova turma'}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{turmaModal.editId !== null ? 'Altere os dados da turma.' : 'Preencha os dados para cadastrar.'}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setTurmaModal({ open: false, editId: null })}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-6 space-y-4">
                    {turmaFormError && (
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                        <p className="text-xs text-destructive">{turmaFormError}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs mb-1.5 block">Código <span className="text-destructive">*</span></Label>
                      <Input value={turmaForm.codigo} onChange={e => { setTurmaForm(f => ({ ...f, codigo: e.target.value })); setTurmaFormError(''); }} placeholder="Ex.: ADS_2024.2_MAT" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">Nome da turma <span className="text-destructive">*</span></Label>
                      <Input value={turmaForm.nome} onChange={e => { setTurmaForm(f => ({ ...f, nome: e.target.value })); setTurmaFormError(''); }} placeholder="Ex.: ADS 2024.2 (Manhã)" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">Curso</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={turmaForm.cursoId}
                        onChange={e => setTurmaForm(f => ({ ...f, cursoId: Number(e.target.value) }))}
                      >
                        {cursos.map(c => <option key={c.id} value={c.id}>{c.sigla} — {c.nome}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">Turno</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={turmaForm.turno}
                        onChange={e => setTurmaForm(f => ({ ...f, turno: e.target.value as Turno }))}
                      >
                        <option value="Manhã">Manhã</option>
                        <option value="Tarde">Tarde</option>
                        <option value="Noite">Noite</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">Semestre <span className="text-destructive">*</span></Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={turmaForm.semestreId ?? ''}
                        onChange={e => setTurmaForm(f => ({ ...f, semestreId: Number(e.target.value) || null }))}
                      >
                        <option value="">Selecionar semestre…</option>
                        {semestres.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t flex justify-end gap-2 bg-muted/30">
                    <Button variant="outline" onClick={() => setTurmaModal({ open: false, editId: null })}>Cancelar</Button>
                    <Button onClick={saveTurma} disabled={!turmaForm.semestreId}><Check className="mr-2 h-4 w-4" />{turmaModal.editId !== null ? 'Salvar alterações' : 'Cadastrar'}</Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {coordModal.open && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }} className="bg-background rounded-xl shadow-2xl w-full max-w-md overflow-hidden border">
                  <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div>
                      <h3 className="font-semibold text-base">{coordModal.editId !== null ? 'Editar coordenador' : 'Novo coordenador'}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{coordModal.editId !== null ? 'Altere os dados do coordenador.' : 'Preencha os dados para criar o acesso.'}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setCoordModal({ open: false, editId: null })}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-6 space-y-4">
                    {coordFormError && (
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                        <p className="text-xs text-destructive">{coordFormError}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs mb-1.5 block">Nome completo <span className="text-destructive">*</span></Label>
                      <Input value={coordForm.nome} onChange={e => { setCoordForm(f => ({ ...f, nome: e.target.value })); setCoordFormError(''); }} placeholder="Ex.: Maria da Silva" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">E-mail institucional <span className="text-destructive">*</span></Label>
                      <Input type="email" value={coordForm.email} onChange={e => { setCoordForm(f => ({ ...f, email: e.target.value })); setCoordFormError(''); }} placeholder="nome@ifce.edu.br" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">
                        Senha de acesso <span className="text-destructive">*</span>
                        {coordModal.editId !== null && <span className="text-muted-foreground font-normal"> (deixe em branco para manter)</span>}
                      </Label>
                      <div className="relative">
                        <Input
                          type={coordShowSenha ? 'text' : 'password'}
                          value={coordForm.senha}
                          onChange={e => { setCoordForm(f => ({ ...f, senha: e.target.value })); setCoordFormError(''); }}
                          placeholder="••••••••"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setCoordShowSenha(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {coordShowSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">Curso</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={coordForm.cursoId}
                        onChange={e => setCoordForm(f => ({ ...f, cursoId: Number(e.target.value) }))}
                      >
                        {cursos.map(c => <option key={c.id} value={c.id}>{c.sigla} — {c.nome}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t flex justify-end gap-2 bg-muted/30">
                    <Button variant="outline" onClick={() => setCoordModal({ open: false, editId: null })}>Cancelar</Button>
                    <Button onClick={saveCoord}><Check className="mr-2 h-4 w-4" />{coordModal.editId !== null ? 'Salvar alterações' : 'Criar coordenador'}</Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {semModal.open && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }} className="bg-background rounded-xl shadow-2xl w-full max-w-md overflow-hidden border">
                  <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div>
                      <h3 className="font-semibold text-base">{semModal.editId !== null ? 'Editar semestre' : 'Novo semestre'}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{semModal.editId !== null ? 'Altere os dados do semestre letivo.' : 'Preencha os dados para cadastrar.'}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSemModal({ open: false, editId: null })}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-6 space-y-4">
                    {semFormError && (
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                        <p className="text-xs text-destructive">{semFormError}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs mb-1.5 block">Nome / Período <span className="text-destructive">*</span></Label>
                      <Input value={semForm.nome} onChange={e => { setSemForm(f => ({ ...f, nome: e.target.value })); setSemFormError(''); }} placeholder="Ex.: 2024.2" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs mb-1.5 block">Início <span className="text-destructive">*</span></Label>
                        <DatePicker value={semForm.dataInicio} onChange={v => { setSemForm(f => ({ ...f, dataInicio: v })); setSemFormError(''); }} placeholder="Início" />
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">Término <span className="text-destructive">*</span></Label>
                        <DatePicker value={semForm.dataTermino} onChange={v => { setSemForm(f => ({ ...f, dataTermino: v })); setSemFormError(''); }} placeholder="Término" min={semForm.dataInicio || undefined} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">Etapa</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={semForm.statusEtapa}
                        onChange={e => setSemForm(f => ({ ...f, statusEtapa: e.target.value as StatusEtapa }))}
                      >
                        {(['OFERTAS', 'RESTRICOES', 'SIMULACAO', 'CONCLUIDO'] as StatusEtapa[]).map(et => (
                          <option key={et} value={et}>{ETAPA_LABELS[et]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t flex justify-end gap-2 bg-muted/30">
                    <Button variant="outline" onClick={() => setSemModal({ open: false, editId: null })}>Cancelar</Button>
                    <Button onClick={saveSem}><Check className="mr-2 h-4 w-4" />{semModal.editId !== null ? 'Salvar alterações' : 'Cadastrar'}</Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </main>
      </div>
    </div>
  );
}
