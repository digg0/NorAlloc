import { apiFetch } from './api';

export type Turno = 'Manhã' | 'Tarde' | 'Noite';

// Formato vindo do backend (snake_case).
interface TurmaBackend {
  id: number;
  nome: string;
  semestre_nivel: number | null;
  curso_id: number | null;
  semestre_id: number | null;
}

// Formato usado na UI (igual ao type Turma do App.tsx).
export interface TurmaUI {
  id: number;
  codigo: string;
  nome: string;
  turno: Turno;
  cursoId: number;
}

export interface TurmaFormData {
  codigo: string;
  nome: string;
  turno: Turno;
  cursoId: number;
}

// O backend não modela turno/codigo. Inferimos o turno a partir do texto do
// nome (que normalmente traz "(Manhã)/(Tarde)/(Noite)") e derivamos um código.
function inferirTurno(nome: string): Turno {
  const n = nome.toLowerCase();
  if (n.includes('tarde')) return 'Tarde';
  if (n.includes('noite') || n.includes('noturno')) return 'Noite';
  return 'Manhã';
}

function derivarCodigo(nome: string, id: number): string {
  const base = nome
    .normalize('NFD')
    .replace(/[^\x00-\x7F]/g, '') // remove acentos (marcas combinantes após NFD)
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
  return base || `TURMA_${id}`;
}

function paraUI(t: TurmaBackend): TurmaUI {
  return {
    id: t.id,
    nome: t.nome,
    codigo: derivarCodigo(t.nome, t.id),
    turno: inferirTurno(t.nome),
    cursoId: t.curso_id ?? 0,
  };
}

function paraBackend(f: TurmaFormData) {
  return {
    nome: f.nome,
    curso_id: f.cursoId,
    semestre_nivel: null,
    semestre_id: null,
  };
}

export async function listarTurmas(): Promise<TurmaUI[]> {
  const dados = await apiFetch<TurmaBackend[]>('/api/turmas');
  return dados.map(paraUI);
}

export async function criarTurma(f: TurmaFormData): Promise<TurmaUI> {
  const nova = await apiFetch<TurmaBackend>('/api/turmas', {
    method: 'POST',
    body: JSON.stringify(paraBackend(f)),
  });
  return paraUI(nova);
}

export async function atualizarTurma(id: number, f: TurmaFormData): Promise<TurmaUI> {
  const atualizada = await apiFetch<TurmaBackend>(`/api/turmas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(paraBackend(f)),
  });
  return paraUI(atualizada);
}

export async function removerTurma(id: number): Promise<void> {
  await apiFetch<void>(`/api/turmas/${id}`, { method: 'DELETE' });
}
