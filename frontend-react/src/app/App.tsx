import React, { useState, useRef, useEffect } from 'react';
import ifceLogo from '../imports/image.png';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Users, BookOpen, Calendar, Plus,
  ChevronRight, ChevronLeft, CheckCircle2, AlertCircle,
  Play, Save, Trash2, Search, Menu, GraduationCap, ShieldAlert,
  Edit, X, Check, LogOut, Eye, EyeOff, Lock, Mail, Camera,
  Star, CalendarCheck, BarChart3, ClipboardList, AlertTriangle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { login as apiLogin, logout as apiLogout, getSessao, type SessaoUsuario } from './services/auth';
import { listarProfessores, criarProfessor, atualizarProfessor, removerProfessor } from './services/professores';
import { getResumoGeral, getResumoProfessor, type ResumoGeral, type ResumoProfessor } from './services/dashboard';
import { CursosView } from './components/CursosView';
import { CoordenadoresView } from './components/CoordenadoresView';
import { TurmasView } from './components/TurmasView';
import { DisciplinasView } from './components/DisciplinasView';
import { getMeuCoordenador, type MeuCoordenadorUI } from './services/coordenadorAtual';
import { listarCursos as listarCursosReais } from './services/cursos';
import { OfertasView } from './components/OfertasView';
import { DisponibilidadeTurmaView } from './components/DisponibilidadeTurmaView';
import { GradeView } from './components/GradeView';
import { AlertasView } from './components/AlertasView';
import { RelatoriosView } from './components/RelatoriosView';
import { listarSemestres, criarSemestre, type SemestreUI, type SemestreFormData } from './services/semestres';
import { obterDisponibilidade, salvarDisponibilidade } from './services/disponibilidadeProfessor';
import { listarAlocacoesPorProfessor } from './services/alocacoes';
import { listarHorarios as listarHorariosReais } from './services/horarios';
import { listarDisciplinasBackend } from './services/disciplinasBackend';
import { listarTurmasBackend } from './services/turmasBackend';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── UI Primitives ──────────────────────────────────────────────────────────────

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

// ── Domain Types ───────────────────────────────────────────────────────────────

type RegimeTrabalho = 'DE' | '20H' | '40H';

type Professor = { id: number; nome: string; email: string; regimeTrabalho: RegimeTrabalho; areaAtuacao: string };

// ── Mock Data ──────────────────────────────────────────────────────────────────

const MOCK_PROFESSORES: Professor[] = [
  { id: 1, nome: 'Ana Silva', email: 'ana.silva@ifce.edu.br', regimeTrabalho: 'DE', areaAtuacao: 'Computação' },
  { id: 2, nome: 'Carlos Santos', email: 'carlos.santos@ifce.edu.br', regimeTrabalho: '40H', areaAtuacao: 'Matemática' },
  { id: 3, nome: 'Beatriz Costa', email: 'beatriz.costa@ifce.edu.br', regimeTrabalho: 'DE', areaAtuacao: 'Redes' },
  { id: 4, nome: 'João Oliveira', email: 'joao.oliveira@ifce.edu.br', regimeTrabalho: '20H', areaAtuacao: 'Computação' },
];

// ── Time Slot Constants ────────────────────────────────────────────────────────

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

// Todas as chaves DIA_SLOT possíveis (usadas para inverter disponível ↔ bloqueado
// ao salvar/carregar a disponibilidade real do professor no backend).
const ALL_DISP_KEYS = DAYS.flatMap(day => SHIFTS.flatMap(shift => shift.slots.map(slot => `${day}_${slot}`)));

// ── Helpers ────────────────────────────────────────────────────────────────────

const REGIME_LABELS: Record<RegimeTrabalho, string> = {
  DE: 'Dedicação Exclusiva',
  '40H': '40 Horas',
  '20H': '20 Horas',
};

const REGIME_MAX_HOURS: Record<RegimeTrabalho, number> = {
  DE: 20,
  '40H': 40,
  '20H': 20,
};

function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR');
}

// ── Main App ───────────────────────────────────────────────────────────────────

type View = 'dashboard' | 'wizard' | 'professores' | 'disciplinas' | 'semestres' | 'turmas' | 'coordenadores' | 'perfil' | 'minha-agenda' | 'minha-disponibilidade' | 'disciplinas-preferidas' | 'cursos' | 'ofertas' | 'disponibilidade-turma' | 'grade' | 'alertas' | 'relatorios';

// ── DatePicker ─────────────────────────────────────────────────────────────────

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

// ── MOCK Users ─────────────────────────────────────────────────────────────────

const MOCK_USERS = [
  { email: 'saulo.anderson@ifce.edu.br', password: '123456',  name: 'Saulo Anderson', role: 'Coordenador',   initials: 'SA' },
  { email: 'admin@ifce.edu.br',          password: 'admin',   name: 'Admin',          role: 'Administrador', initials: 'AD' },
  { email: 'ana.silva@ifce.edu.br',      password: 'prof123', name: 'Ana Silva',      role: 'Professor',     initials: 'AS' },
];

// ── Login Screen ───────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (user: SessaoUsuario) => void }) {
  const [email, setEmail] = useState('saulo.anderson@ifce.edu.br');
  const [password, setPassword] = useState('123456');
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

          <div className="mt-6 p-3 bg-gray-50 border border-gray-100 rounded-xl">
            <p className="text-[11px] text-gray-500 mb-1.5 font-medium">Credenciais de demonstração:</p>
            <div className="space-y-1">
              {MOCK_USERS.map(u => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => { setEmail(u.email); setPassword(u.password); setError(''); }}
                  className="w-full text-left text-[11px] text-gray-500 hover:text-[#2D6A4F] transition-colors font-mono"
                >
                  {u.email} / {u.password}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Root App ───────────────────────────────────────────────────────────────────

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

// ── AppShell ───────────────────────────────────────────────────────────────────

function AppShell({ currentUser, onLogout }: { currentUser: SessaoUsuario; onLogout: () => void }) {
  const isAdmin = currentUser.role === 'Administrador';
  const isProf  = currentUser.role === 'Professor';
  const [currentView, setCurrentView] = useState<View>(
    isAdmin ? 'dashboard' : isProf ? 'minha-agenda' : 'semestres'
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ── Perfil ────────────────────────────────────────────────────────────────
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  const handleSaveProfile = () => {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  // ── Entidades com CRUD funcional ──────────────────────────────────────────
  const [professores, setProfessores] = useState<Professor[]>([...MOCK_PROFESSORES]);

  // Carrega os professores reais do backend ao montar (cai para o mock se o
  // backend estiver indisponível, mantendo a demo navegável).
  useEffect(() => {
    listarProfessores()
      .then(setProfessores)
      .catch(() => { /* backend offline: mantém os dados de exemplo */ });
  }, []);

  // Dados agregados do dashboard, puxados do banco conforme o perfil.
  const [resumo, setResumo] = useState<ResumoGeral | null>(null);
  const [resumoProf, setResumoProf] = useState<ResumoProfessor | null>(null);
  useEffect(() => {
    if (isProf) {
      getResumoProfessor().then(setResumoProf).catch(() => {});
    } else {
      getResumoGeral().then(setResumo).catch(() => {});
    }
  }, [isProf]);

  // Coordenador: trava o curso nos formulários de turma/disciplina (o backend
  // já restringe os dados retornados, isso só evita mostrar um seletor com
  // todos os cursos quando o coordenador só pode usar o próprio).
  const [meuCoordenador, setMeuCoordenador] = useState<MeuCoordenadorUI | null>(null);
  const [meuCursoFixo, setMeuCursoFixo] = useState<{ id: number; nome: string } | null>(null);
  useEffect(() => {
    if (isAdmin || isProf) return;
    getMeuCoordenador()
      .then((coord) => {
        setMeuCoordenador(coord);
        if (!coord) return;
        return listarCursosReais().then((cursos) => {
          const curso = cursos.find((c) => c.id === coord.cursoId);
          setMeuCursoFixo(curso ? { id: curso.id, nome: curso.nome } : null);
        });
      })
      .catch(() => {});
  }, [isAdmin, isProf]);

  // ── Search state per view ─────────────────────────────────────────────────
  const [profSearch, setProfSearch] = useState('');

  // ── Professor CRUD ────────────────────────────────────────────────────────
  type ProfForm = Omit<Professor, 'id'>;
  const emptyProfForm: ProfForm = { nome: '', email: '', regimeTrabalho: 'DE', areaAtuacao: '' };
  const [profModal, setProfModal] = useState<{ open: boolean; editId: number | null }>({ open: false, editId: null });
  const [profForm, setProfForm] = useState<ProfForm>(emptyProfForm);
  const [profFormError, setProfFormError] = useState('');

  const openProfAdd = () => { setProfForm(emptyProfForm); setProfFormError(''); setProfModal({ open: true, editId: null }); };
  const openProfEdit = (p: Professor) => { setProfForm({ nome: p.nome, email: p.email, regimeTrabalho: p.regimeTrabalho, areaAtuacao: p.areaAtuacao }); setProfFormError(''); setProfModal({ open: true, editId: p.id }); };
  const saveProf = async () => {
    if (!profForm.nome.trim() || !profForm.email.trim()) { setProfFormError('Nome e e-mail são obrigatórios.'); return; }
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


  // ── Novo Semestre (wizard simplificado: só cria o semestre, de verdade) ────
  const emptyNovoSemestreForm: SemestreFormData = { nome: '', dataInicio: '', dataFim: '', status: 'PLANEJAMENTO' };
  const [novoSemestreForm, setNovoSemestreForm] = useState<SemestreFormData>(emptyNovoSemestreForm);
  const [novoSemestreErro, setNovoSemestreErro] = useState('');
  const [criandoSemestre, setCriandoSemestre] = useState(false);

  const [semestresLista, setSemestresLista] = useState<SemestreUI[]>([]);
  const [semestresCarregando, setSemestresCarregando] = useState(true);

  const carregarSemestres = () => {
    setSemestresCarregando(true);
    listarSemestres()
      .then(setSemestresLista)
      .catch(() => {})
      .finally(() => setSemestresCarregando(false));
  };

  useEffect(() => {
    if (isAdmin || isProf) return;
    carregarSemestres();
  }, [isAdmin, isProf]);

  const criarNovoSemestre = async () => {
    if (!novoSemestreForm.nome || !novoSemestreForm.dataInicio || !novoSemestreForm.dataFim) {
      setNovoSemestreErro('Preencha o período, a data de início e a data de término.');
      return;
    }
    if (novoSemestreForm.dataFim <= novoSemestreForm.dataInicio) {
      setNovoSemestreErro('A data de término deve ser posterior à data de início.');
      return;
    }
    setCriandoSemestre(true);
    setNovoSemestreErro('');
    try {
      await criarSemestre(novoSemestreForm);
      setNovoSemestreForm(emptyNovoSemestreForm);
      carregarSemestres();
      setCurrentView('semestres');
    } catch (err: any) {
      setNovoSemestreErro(err?.message || 'Erro ao criar semestre.');
    } finally {
      setCriandoSemestre(false);
    }
  };

  // ── Navigation ────────────────────────────────────────────────────────────

  const adminNavItems: { view: View; label: string; icon: React.ReactNode }[] = [
    { view: 'dashboard',     label: 'Dashboard',     icon: <LayoutDashboard className="mr-2 h-4 w-4" /> },
    { view: 'cursos',        label: 'Cursos',        icon: <GraduationCap   className="mr-2 h-4 w-4" /> },
    { view: 'coordenadores', label: 'Coordenadores', icon: <ShieldAlert     className="mr-2 h-4 w-4" /> },
    { view: 'professores',   label: 'Professores',   icon: <Users           className="mr-2 h-4 w-4" /> },
    { view: 'disciplinas',   label: 'Disciplinas',   icon: <BookOpen        className="mr-2 h-4 w-4" /> },
    { view: 'turmas',        label: 'Turmas',        icon: <GraduationCap   className="mr-2 h-4 w-4" /> },
    { view: 'relatorios',    label: 'Relatórios',    icon: <BarChart3       className="mr-2 h-4 w-4" /> },
  ];

  const coordNavItems: { view: View; label: string; icon: React.ReactNode }[] = [
    { view: 'dashboard',              label: 'Dashboard',                icon: <LayoutDashboard className="mr-2 h-4 w-4" /> },
    { view: 'semestres',              label: 'Semestres',                icon: <Calendar        className="mr-2 h-4 w-4" /> },
    { view: 'professores',            label: 'Professores',              icon: <Users           className="mr-2 h-4 w-4" /> },
    { view: 'disciplinas',            label: 'Disciplinas',              icon: <BookOpen        className="mr-2 h-4 w-4" /> },
    { view: 'turmas',                 label: 'Turmas',                   icon: <GraduationCap   className="mr-2 h-4 w-4" /> },
    { view: 'ofertas',                label: 'Ofertas de Disciplina',    icon: <ClipboardList   className="mr-2 h-4 w-4" /> },
    { view: 'disponibilidade-turma',  label: 'Disponibilidade de Turmas', icon: <CalendarCheck   className="mr-2 h-4 w-4" /> },
    { view: 'grade',                  label: 'Grade Horária',            icon: <Play            className="mr-2 h-4 w-4" /> },
    { view: 'alertas',                label: 'Alertas',                  icon: <AlertTriangle   className="mr-2 h-4 w-4" /> },
    { view: 'relatorios',             label: 'Relatórios',               icon: <BarChart3       className="mr-2 h-4 w-4" /> },
    // Coordenadores também são docentes da instituição — também informam a
    // própria disponibilidade de horário, como qualquer professor.
    { view: 'minha-disponibilidade',  label: 'Minha Disponibilidade',    icon: <CalendarCheck   className="mr-2 h-4 w-4" /> },
  ];

  const profNavItems: { view: View; label: string; icon: React.ReactNode }[] = [
    { view: 'minha-agenda',           label: 'Minha Agenda',           icon: <Calendar      className="mr-2 h-4 w-4" /> },
    { view: 'minha-disponibilidade',  label: 'Minha Disponibilidade',  icon: <CalendarCheck className="mr-2 h-4 w-4" /> },
    { view: 'disciplinas-preferidas', label: 'Disciplinas Preferidas', icon: <Star          className="mr-2 h-4 w-4" /> },
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
    perfil:                   'Meu Perfil',
    'minha-agenda':           'Minha Agenda',
    'minha-disponibilidade':  'Minha Disponibilidade',
    'disciplinas-preferidas': 'Disciplinas Preferidas',
    cursos:                   'Cursos',
    ofertas:                  'Ofertas de Disciplina',
    'disponibilidade-turma':  'Disponibilidade de Turmas',
    grade:                    'Grade Horária',
    alertas:                  'Alertas da Grade',
    relatorios:                'Relatórios',
  };

  const profLogado = professores.find(p => p.email === currentUser.email);

  // ── Agenda real do professor (calculada a partir das alocações) ───────────
  type AgendaSlot = { day: string; slot: string; disciplina: string; turma: string; colorClass: string };
  const DIA_CURTO: Record<string, string> = { SEGUNDA: 'SEG', TERCA: 'TER', QUARTA: 'QUA', QUINTA: 'QUI', SEXTA: 'SEX', SABADO: 'SAB' };
  const TURNO_LETRA: Record<string, string> = { MANHA: 'M', TARDE: 'T', NOITE: 'N' };
  const PALETA_AGENDA = [
    'bg-blue-100 border-blue-300 text-blue-800',
    'bg-emerald-100 border-emerald-300 text-emerald-800',
    'bg-amber-100 border-amber-300 text-amber-800',
    'bg-purple-100 border-purple-300 text-purple-800',
    'bg-rose-100 border-rose-300 text-rose-800',
  ];

  const [profAgenda, setProfAgenda] = useState<AgendaSlot[]>([]);

  useEffect(() => {
    if (!profLogado) return;
    Promise.all([
      listarAlocacoesPorProfessor(profLogado.id),
      listarHorariosReais(),
      listarDisciplinasBackend(),
      listarTurmasBackend(),
    ])
      .then(([alocacoes, horarios, disciplinas, turmas]) => {
        // Mapeia cada Horario para o código DIA_SLOT (ex.: "SEG_M1"),
        // posição cronológica dentro do mesmo dia+turno — mesma lógica do
        // backend (solver_service._slot_codes_por_horario).
        const porDiaTurno = new Map<string, typeof horarios>();
        for (const h of horarios) {
          const chave = `${h.diaSemana}_${h.turno}`;
          const lista = porDiaTurno.get(chave) ?? [];
          lista.push(h);
          porDiaTurno.set(chave, lista);
        }
        const slotCodeByHorarioId = new Map<number, string>();
        for (const lista of porDiaTurno.values()) {
          lista.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
          lista.forEach((h, indice) => {
            slotCodeByHorarioId.set(h.id, `${TURNO_LETRA[h.turno] ?? '?'}${indice + 1}`);
          });
        }

        const agenda: AgendaSlot[] = [];
        alocacoes.forEach((a, indice) => {
          if (!a.horario || !a.oferta) return;
          const dia = DIA_CURTO[a.horario.dia_semana];
          const slot = slotCodeByHorarioId.get(a.horario.id);
          if (!dia || !slot) return;
          const disciplina = disciplinas.find((d) => d.id === a.oferta!.disciplina_id);
          const turma = turmas.find((t) => t.id === a.oferta!.turma_id);
          agenda.push({
            day: dia,
            slot,
            disciplina: disciplina?.nome ?? `Disciplina #${a.oferta!.disciplina_id}`,
            turma: turma?.nome ?? `Turma #${a.oferta!.turma_id}`,
            colorClass: PALETA_AGENDA[(a.oferta!.disciplina_id + indice) % PALETA_AGENDA.length],
          });
        });
        setProfAgenda(agenda);
      })
      .catch(() => {});
  }, [profLogado?.id]);

  const maxHoras = profLogado ? REGIME_MAX_HOURS[profLogado.regimeTrabalho] : 20;
  const horasAlocadas = profAgenda.length;

  // ── Professor disponibilidade state (real, via backend) ────────────────────
  const [disponibilidade, setDisponibilidade] = useState<Set<string>>(new Set());
  const [dispSaved, setDispSaved] = useState(false);
  const [dispSemestres, setDispSemestres] = useState<SemestreUI[]>([]);
  const [dispSemestreId, setDispSemestreId] = useState<number>(0);
  const [dispLoading, setDispLoading] = useState(false);
  const [dispErro, setDispErro] = useState('');
  const [limiteCargaDisp, setLimiteCargaDisp] = useState<number>(20);

  const toggleDisponibilidade = (key: string) => {
    setDisponibilidade(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  useEffect(() => {
    // Disponibilidade vale pra qualquer docente — inclusive coordenador,
    // que também é professor da instituição.
    if (!isProf && !profLogado) return;
    listarSemestres()
      .then(s => {
        setDispSemestres(s);
        setDispSemestreId(prev => prev || s.find(x => x.status === 'ATIVO')?.id || s[0]?.id || 0);
      })
      .catch(() => {});
  }, [isProf, profLogado]);

  useEffect(() => {
    if (!profLogado || !dispSemestreId) return;
    setDispLoading(true);
    setDispErro('');
    obterDisponibilidade(profLogado.id, dispSemestreId)
      .then(reg => {
        if (reg) {
          const bloqueados = new Set(reg.horariosBloqueados);
          setDisponibilidade(new Set(ALL_DISP_KEYS.filter(k => !bloqueados.has(k))));
          setLimiteCargaDisp(reg.limiteCargaHoraria);
        } else {
          setDisponibilidade(new Set(ALL_DISP_KEYS));
          setLimiteCargaDisp(REGIME_MAX_HOURS[profLogado.regimeTrabalho] ?? 20);
        }
      })
      .catch(err => setDispErro(err?.message || 'Erro ao carregar disponibilidade.'))
      .finally(() => setDispLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProf, profLogado?.id, dispSemestreId]);

  const handleSaveDisp = async () => {
    if (!profLogado || !dispSemestreId) return;
    setDispLoading(true);
    setDispErro('');
    try {
      const bloqueados = ALL_DISP_KEYS.filter(k => !disponibilidade.has(k));
      await salvarDisponibilidade(profLogado.id, dispSemestreId, bloqueados, limiteCargaDisp);
      setDispSaved(true);
      setTimeout(() => setDispSaved(false), 2500);
    } catch (err: any) {
      setDispErro(err?.message || 'Erro ao salvar disponibilidade.');
    } finally {
      setDispLoading(false);
    }
  };

  // ── Disciplinas preferidas state ──────────────────────────────────────────
  const DISC_PREF_LIST = [
    { sigla: 'AED',  nome: 'Algoritmos e Estruturas de Dados',  curso: 'ADS', cargaHoraria: 80 },
    { sigla: 'ES',   nome: 'Engenharia de Software',             curso: 'ADS', cargaHoraria: 80 },
    { sigla: 'BD',   nome: 'Banco de Dados',                     curso: 'ADS', cargaHoraria: 80 },
    { sigla: 'POO',  nome: 'Programação Orientada a Objetos',    curso: 'ADS', cargaHoraria: 80 },
    { sigla: 'RC',   nome: 'Redes de Computadores',              curso: 'ADS', cargaHoraria: 80 },
    { sigla: 'SO',   nome: 'Sistemas Operacionais',              curso: 'ADS', cargaHoraria: 80 },
    { sigla: 'WEB',  nome: 'Desenvolvimento Web',                curso: 'ADS', cargaHoraria: 80 },
    { sigla: 'IHC',  nome: 'Interface Humano-Computador',        curso: 'ADS', cargaHoraria: 40 },
  ];

  const [discPreferidas, setDiscPreferidas] = useState<Set<string>>(new Set(['AED', 'ES']));
  const [prefSaved, setPrefSaved] = useState(false);

  const toggleDiscPref = (sigla: string) => {
    setDiscPreferidas(prev => {
      const next = new Set(prev);
      if (next.has(sigla)) next.delete(sigla); else next.add(sigla);
      return next;
    });
  };

  const handleSavePref = () => {
    setPrefSaved(true);
    setTimeout(() => setPrefSaved(false), 2500);
  };


  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* ── Sidebar ── */}
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
              {/* Clickable user info → goes to perfil */}
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

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
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

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">

          {/* ── DASHBOARD ──────────────────────────────────────────────── */}
          {currentView === 'dashboard' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Bem-vindo ao NorAlloc</h2>
                  <p className="text-muted-foreground">Gerencie a alocação de professores do IFCE Campus Tauá.</p>
                </div>
                {!isAdmin && (
                  <Button onClick={() => setCurrentView('wizard')}>
                    <Play className="mr-2 h-4 w-4" />
                    Nova Simulação
                  </Button>
                )}
              </div>

              {/* Stat cards */}
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
                    <div className="text-2xl font-bold">{resumo?.disciplinas ?? 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Em {resumo?.cursos ?? 0} cursos
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Semestre Atual</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {resumo?.semestre_atual ? (
                      <>
                        <div className="text-2xl font-bold">{resumo.semestre_atual.nome}</div>
                        <Badge variant="secondary" className="mt-1">{resumo.semestre_atual.status}</Badge>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">Nenhum ativo</div>
                    )}
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

              {/* Próximos passos / Histórico */}
              <div className="grid gap-4 md:grid-cols-2">
                {!isAdmin && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Próximos Passos</CardTitle>
                      <CardDescription>Fluxo de montagem da grade do semestre.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {[
                        { label: 'Ofertas de Disciplina', view: 'ofertas' as View },
                        { label: 'Disponibilidade de Turmas', view: 'disponibilidade-turma' as View },
                        { label: 'Gerar Grade Horária', view: 'grade' as View },
                        { label: 'Alertas da Grade', view: 'alertas' as View },
                      ].map(step => (
                        <Button
                          key={step.view}
                          variant="outline"
                          className="w-full justify-between"
                          onClick={() => setCurrentView(step.view)}
                        >
                          {step.label}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      ))}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Histórico de Semestres</CardTitle>
                    <CardDescription>Situação por período letivo.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(resumo?.semestres ?? []).map(sem => (
                      <div key={sem.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium text-sm">{sem.nome}</p>
                          <p className="text-xs text-muted-foreground">{fmtDate(sem.data_inicio)} – {fmtDate(sem.data_fim)}</p>
                        </div>
                        <Badge variant="secondary">{sem.status}</Badge>
                      </div>
                    ))}
                    {(!resumo || resumo.semestres.length === 0) && (
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

          {/* ── WIZARD ────────────────────────────────────────────────── */}
          {currentView === 'wizard' && (
            <div className="max-w-lg mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Novo Semestre Letivo</h2>
                  <p className="text-muted-foreground">Informe os dados do período letivo.</p>
                </div>
                <Button variant="ghost" onClick={() => setCurrentView(isAdmin ? 'dashboard' : 'semestres')}>Cancelar</Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Dados do Semestre</CardTitle>
                  <CardDescription>
                    Depois de criado, configure Ofertas, Disponibilidade de Turmas e gere a Grade Horária nas respectivas telas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {novoSemestreErro && (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                      <p className="text-xs text-destructive">{novoSemestreErro}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="nome">Período Letivo (ex: 2026.2)</Label>
                    <Input id="nome" value={novoSemestreForm.nome} onChange={e => { setNovoSemestreForm(f => ({ ...f, nome: e.target.value })); setNovoSemestreErro(''); }} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data de Início</Label>
                      <DatePicker value={novoSemestreForm.dataInicio} onChange={v => setNovoSemestreForm(f => ({ ...f, dataInicio: v }))} placeholder="Selecione a data de início" />
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Término</Label>
                      <DatePicker value={novoSemestreForm.dataFim} onChange={v => setNovoSemestreForm(f => ({ ...f, dataFim: v }))} placeholder="Selecione a data de término" min={novoSemestreForm.dataInicio || undefined} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={novoSemestreForm.status}
                      onChange={e => setNovoSemestreForm(f => ({ ...f, status: e.target.value }))}
                    >
                      <option value="PLANEJAMENTO">Planejamento</option>
                      <option value="ATIVO">Ativo</option>
                      <option value="CONCLUIDO">Concluído</option>
                    </select>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t p-4 md:p-6 bg-muted/10 rounded-b-lg">
                  <Button variant="outline" onClick={() => setCurrentView(isAdmin ? 'dashboard' : 'semestres')}>Cancelar</Button>
                  <Button onClick={criarNovoSemestre} disabled={criandoSemestre}>
                    <Save className="mr-2 h-4 w-4" />{criandoSemestre ? 'Criando…' : 'Criar Semestre'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}

          {/* ── PROFESSORES ───────────────────────────────────────────── */}
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
                  <Button onClick={openProfAdd}>
                    <Plus className="mr-2 h-4 w-4" />Novo Professor
                  </Button>
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
                      <TableHead className="text-right">Ações</TableHead>
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
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => openProfEdit(prof)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteProf(prof.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    {professores.filter(p => !profSearch || p.nome.toLowerCase().includes(profSearch.toLowerCase()) || p.email.toLowerCase().includes(profSearch.toLowerCase())).length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum professor encontrado.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
              <p className="text-xs text-muted-foreground">DE: mín 10h — máx 20h em sala/sem · 40H: máx 40h/sem · 20H: máx 20h/sem</p>
            </motion.div>
          )}

          {/* ── CURSOS ─────────────────────────────────────────────────── */}
          {currentView === 'cursos' && isAdmin && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-6xl mx-auto">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Cursos</h2>
                <p className="text-muted-foreground">Cadastro de cursos institucionais — apenas o Administrador pode criar, editar e inativar.</p>
              </div>
              <CursosView />
            </motion.div>
          )}

          {/* ── DISCIPLINAS ────────────────────────────────────────────── */}
          {currentView === 'disciplinas' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-6xl mx-auto">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Disciplinas</h2>
                <p className="text-muted-foreground">Matriz curricular por curso.</p>
              </div>
              <DisciplinasView cursoFixo={meuCursoFixo} />
            </motion.div>
          )}

          {/* ── TURMAS ─────────────────────────────────────────────────── */}
          {currentView === 'turmas' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-6xl mx-auto">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Turmas</h2>
                <p className="text-muted-foreground">Turmas por curso e semestre.</p>
              </div>
              <TurmasView cursoFixo={meuCursoFixo} />
            </motion.div>
          )}

          {/* ── SEMESTRES ──────────────────────────────────────────────── */}
          {currentView === 'semestres' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Semestres Letivos</h2>
                  <p className="text-muted-foreground">Períodos letivos cadastrados.</p>
                </div>
                <Button onClick={() => setCurrentView('wizard')}>
                  <Plus className="mr-2 h-4 w-4" />Criar Semestre
                </Button>
              </div>
              {semestresCarregando ? (
                <p className="text-sm text-muted-foreground">Carregando…</p>
              ) : semestresLista.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm border rounded-lg">
                  Nenhum semestre cadastrado ainda.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {semestresLista.map(sem => (
                    <Card key={sem.id} className="relative overflow-hidden">
                      <CardHeader>
                        <CardTitle className="text-xl">{sem.nome}</CardTitle>
                        <CardDescription>{fmtDate(sem.dataInicio)} até {fmtDate(sem.dataFim)}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Badge variant={sem.status === 'ATIVO' ? 'default' : sem.status === 'CONCLUIDO' ? 'success' : 'secondary'}>{sem.status}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── COORDENADORES ─────────────────────────────────────────── */}
          {currentView === 'coordenadores' && isAdmin && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl mx-auto">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Coordenadores</h2>
                <p className="text-muted-foreground">Coordenadores são docentes da instituição designados para gerir um curso.</p>
              </div>
              <CoordenadoresView />
            </motion.div>
          )}

          {/* ── PERFIL ────────────────────────────────────────────────── */}
          {currentView === 'perfil' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Meu Perfil</h2>
                <p className="text-muted-foreground">Edite seu nome e foto de perfil.</p>
              </div>
              <Card>
                <CardContent className="pt-8 space-y-6">
                  {/* Photo upload */}
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

          {/* ── MINHA AGENDA (professor only) ─────────────────────────── */}
          {currentView === 'minha-agenda' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl mx-auto">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Minha Agenda</h2>
                <p className="text-muted-foreground">Sua carga horária e grade de aulas — semestre 2024.1</p>
              </div>

              {/* Stats — 4 cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                    <p className="text-xs text-muted-foreground mt-1">Ofertas vinculadas a você no semestre</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Horários Disponíveis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{disponibilidade.size}</div>
                    <button
                      onClick={() => setCurrentView('minha-disponibilidade')}
                      className="text-xs text-primary hover:underline mt-1 block"
                    >
                      Editar disponibilidade →
                    </button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Disciplinas Preferidas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-600">{discPreferidas.size}</div>
                    <button
                      onClick={() => setCurrentView('disciplinas-preferidas')}
                      className="text-xs text-primary hover:underline mt-1 block"
                    >
                      Editar preferências →
                    </button>
                  </CardContent>
                </Card>
              </div>

              {/* Weekly calendar */}
              <Card>
                <CardHeader>
                  <CardTitle>Grade Semanal</CardTitle>
                  <CardDescription>Suas aulas alocadas para o semestre 2024.1</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr>
                          <th className="p-2 text-left text-muted-foreground w-20 border-b">Horário</th>
                          {DAYS.map(d => (
                            <th key={d} className="p-2 text-center text-muted-foreground border-b font-semibold">{DAY_LABELS[d]}</th>
                          ))}
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
                                  const aula = profAgenda.find(a => a.day === day && a.slot === slot);
                                  return (
                                    <td key={day} className="p-1 text-center">
                                      {aula ? (
                                        <div className={cn('rounded border px-1 py-1 text-center leading-tight overflow-hidden', aula.colorClass)} title={`${aula.disciplina} — ${aula.turma}`}>
                                          <p className="font-bold text-[10px] truncate">{aula.disciplina}</p>
                                          <p className="text-[9px] opacity-70 truncate">{aula.turma}</p>
                                        </div>
                                      ) : (
                                        <div className="w-full h-7 rounded bg-muted/30 border border-muted/50" />
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
                  <div className="mt-4 flex flex-wrap gap-3">
                    {[...new Set(profAgenda.map(a => a.disciplina))].map(disc => {
                      const sample = profAgenda.find(a => a.disciplina === disc)!;
                      return (
                        <div key={disc} className={cn('flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium', sample.colorClass)}>
                          <div className="w-2.5 h-2.5 rounded-sm border border-current opacity-70" />
                          {disc}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── MINHA DISPONIBILIDADE ────────────────────────────────── */}
          {currentView === 'minha-disponibilidade' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl mx-auto">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Minha Disponibilidade</h2>
                <p className="text-muted-foreground">Informe os horários em que você está disponível para receber alocação de aulas.</p>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Grade de Disponibilidade</CardTitle>
                      <CardDescription className="mt-1">
                        Clique nas células para marcar sua disponibilidade. Verde = disponível · Azul = aula já alocada.
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <select
                        className="flex h-9 rounded-md border border-input bg-background px-2 text-sm"
                        value={dispSemestreId}
                        onChange={e => setDispSemestreId(Number(e.target.value))}
                      >
                        {dispSemestres.length === 0 && <option value={0}>Sem semestres</option>}
                        {dispSemestres.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                      </select>
                      <div className="flex items-center gap-1.5">
                        <Label htmlFor="limiteCargaDisp" className="text-xs whitespace-nowrap">Limite (h/sem):</Label>
                        <Input
                          id="limiteCargaDisp"
                          type="number"
                          min={1}
                          value={limiteCargaDisp}
                          onChange={e => setLimiteCargaDisp(Number(e.target.value) || 1)}
                          className="w-20 h-9"
                        />
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        Horários selecionados: <strong className="text-foreground">{disponibilidade.size}</strong>
                      </span>
                      <Button variant="outline" size="sm" onClick={() => setDisponibilidade(new Set())}>
                        Limpar seleção
                      </Button>
                      <Button size="sm" onClick={handleSaveDisp} disabled={dispLoading || !dispSemestreId}>
                        <Save className="mr-1.5 h-3.5 w-3.5" />{dispLoading ? 'Salvando…' : 'Salvar disponibilidade'}
                      </Button>
                    </div>
                  </div>
                  {dispErro && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                      <p className="text-xs text-destructive">{dispErro}</p>
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
                        {SHIFTS.map(shift => (
                          <React.Fragment key={shift.id}>
                            <tr>
                              <td colSpan={7} className="pt-3 pb-1 px-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{shift.label}</span>
                              </td>
                            </tr>
                            {shift.slots.map(slotId => (
                              <tr key={slotId} className="border-b border-muted/30 last:border-b-0">
                                <td className="p-1.5 whitespace-nowrap">
                                  <span className="font-mono text-muted-foreground">{slotId}</span>
                                  <span className="ml-1.5 text-muted-foreground/60">{SLOT_TIMES[slotId]}</span>
                                </td>
                                {DAYS.map(day => {
                                  const key = `${day}_${slotId}`;
                                  const alocada = profAgenda.find(a => a.day === day && a.slot === slotId);
                                  const isDisp = disponibilidade.has(key);
                                  return (
                                    <td key={day} className="p-1 text-center">
                                      {alocada ? (
                                        <div className="w-full min-h-[36px] rounded border bg-blue-100 border-blue-300 text-blue-800 flex flex-col items-center justify-center px-1 py-1 cursor-not-allowed overflow-hidden" title={`${alocada.disciplina} — já alocada, não editável aqui`}>
                                          <span className="font-bold text-[10px] truncate max-w-full">{alocada.disciplina}</span>
                                          <span className="text-[9px] opacity-70">Alocada</span>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => toggleDisponibilidade(key)}
                                          className={cn(
                                            'w-full min-h-[36px] rounded border transition-all duration-150 flex flex-col items-center justify-center px-1 py-1 text-[10px] font-medium',
                                            isDisp
                                              ? 'bg-green-100 border-green-400 text-green-800 hover:bg-green-200'
                                              : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
                                          )}
                                        >
                                          {isDisp ? (
                                            <>
                                              <Check className="h-3 w-3 mb-0.5" />
                                              <span>Disponível</span>
                                            </>
                                          ) : '—'}
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

                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded border bg-green-100 border-green-400" />
                      <span>Disponível</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded border bg-gray-50 border-gray-200" />
                      <span>Indisponível</span>
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

          {/* ── DISCIPLINAS PREFERIDAS ────────────────────────────────── */}
          {currentView === 'disciplinas-preferidas' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Disciplinas Preferidas</h2>
                  <p className="text-muted-foreground">Selecione as disciplinas que você tem preferência em ministrar neste semestre.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Selecionadas: <strong className="text-foreground">{discPreferidas.size}</strong>
                  </span>
                  <Button onClick={handleSavePref}>
                    <Save className="mr-1.5 h-4 w-4" />Salvar preferências
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {prefSaved && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <p className="text-xs text-green-700 font-medium">Preferências salvas com sucesso.</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {DISC_PREF_LIST.map(disc => {
                  const selected = discPreferidas.has(disc.sigla);
                  return (
                    <motion.button
                      key={disc.sigla}
                      type="button"
                      onClick={() => toggleDiscPref(disc.sigla)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'relative text-left rounded-xl border-2 p-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        selected
                          ? 'border-green-500 bg-green-50 shadow-sm'
                          : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
                      )}
                    >
                      {selected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                      <div className={cn(
                        'inline-flex items-center rounded-lg px-2.5 py-1 text-sm font-bold mb-2',
                        selected ? 'bg-green-500 text-white' : 'bg-primary/10 text-primary'
                      )}>
                        {disc.sigla}
                      </div>
                      <p className={cn('text-sm font-medium leading-tight', selected ? 'text-green-900' : 'text-foreground')}>
                        {disc.nome}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={cn('text-[10px]', selected && 'border-green-300 text-green-700')}>
                          {disc.curso}
                        </Badge>
                        <span className={cn('text-[10px]', selected ? 'text-green-600' : 'text-muted-foreground')}>
                          {disc.cargaHoraria}h
                        </span>
                      </div>
                      {selected && (
                        <p className="text-[10px] font-semibold text-green-600 mt-2">✓ Selecionada</p>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground">
                Suas preferências são consideradas no processo de alocação automática, mas não garantem a atribuição.
              </p>
            </motion.div>
          )}

          {/* ── OFERTAS DE DISCIPLINA ─────────────────────────────────── */}
          {currentView === 'ofertas' && !isAdmin && !isProf && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Ofertas de Disciplina</h2>
                <p className="text-muted-foreground">Defina quais disciplinas serão ofertadas por turma — a entrada do solver de geração de grade.</p>
              </div>
              <OfertasView />
            </motion.div>
          )}

          {/* ── DISPONIBILIDADE DE TURMAS ──────────────────────────────── */}
          {currentView === 'disponibilidade-turma' && !isAdmin && !isProf && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Disponibilidade de Turmas</h2>
                <p className="text-muted-foreground">Configure os horários em que cada turma pode receber aulas.</p>
              </div>
              <DisponibilidadeTurmaView />
            </motion.div>
          )}

          {/* ── GRADE HORÁRIA (geração e edição manual) ───────────────── */}
          {currentView === 'grade' && !isAdmin && !isProf && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Grade Horária</h2>
                <p className="text-muted-foreground">Gere a grade automaticamente com o Solver Z3 e ajuste manualmente quando necessário.</p>
              </div>
              <GradeView />
            </motion.div>
          )}

          {/* ── ALERTAS DA GRADE ───────────────────────────────────────── */}
          {currentView === 'alertas' && !isAdmin && !isProf && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Alertas da Grade</h2>
                <p className="text-muted-foreground">Conflitos, sobrecargas e demais inconsistências calculadas dinamicamente sobre a grade atual.</p>
              </div>
              <AlertasView />
            </motion.div>
          )}

          {/* ── RELATÓRIOS ─────────────────────────────────────────────── */}
          {currentView === 'relatorios' && !isProf && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Relatórios</h2>
                <p className="text-muted-foreground">Grade consolidada por curso e semestre, com resumo, professores envolvidos e alertas.</p>
              </div>
              <RelatoriosView cursoFixo={meuCursoFixo} />
            </motion.div>
          )}

          {/* ── MODALS ────────────────────────────────────────────────── */}

          {/* Professor Modal */}
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
                  </div>
                  <div className="px-6 py-4 border-t flex justify-end gap-2 bg-muted/30">
                    <Button variant="outline" onClick={() => setProfModal({ open: false, editId: null })}>Cancelar</Button>
                    <Button onClick={saveProf}><Check className="mr-2 h-4 w-4" />{profModal.editId !== null ? 'Salvar alterações' : 'Cadastrar'}</Button>
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
