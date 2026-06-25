import { apiFetch } from './api';

export type Turno = 'Manhã' | 'Tarde' | 'Noite';

interface TurmaBackend {
  id: number;
  nome: string;
  semestre_nivel: number | null;
  curso_id: number | null;
  semestre_id: number | null;
}

export interface TurmaUI {
  id: number;
  codigo: string;
  nome: string;
  turno: Turno;
  cursoId: number;
  semestreId: number | null;
}

export interface TurmaFormData {
  codigo: string;
  nome: string;
  turno: Turno;
  cursoId: number;
  semestreId?: number | null;
}

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
    semestreId: t.semestre_id ?? null,
  };
}

function paraBackend(f: TurmaFormData) {
  return {
    nome: f.nome,
    curso_id: f.cursoId,
    semestre_nivel: null,
    semestre_id: f.semestreId ?? null,
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
