import { apiFetch } from './api';

export interface TurmaBackendUI {
  id: number;
  nome: string;
  cursoId: number | null;
  semestreId: number | null;
  semestreNivel: number | null;
}

export interface TurmaFormData {
  nome: string;
  cursoId: number | null;
  semestreId: number | null;
  semestreNivel: number | null;
}

interface TurmaBackend {
  id: number;
  nome: string;
  curso_id: number | null;
  semestre_id: number | null;
  semestre_nivel: number | null;
}

function paraUI(t: TurmaBackend): TurmaBackendUI {
  return {
    id: t.id,
    nome: t.nome,
    cursoId: t.curso_id,
    semestreId: t.semestre_id,
    semestreNivel: t.semestre_nivel,
  };
}

function paraBackend(f: TurmaFormData) {
  return {
    nome: f.nome,
    curso_id: f.cursoId,
    semestre_id: f.semestreId,
    semestre_nivel: f.semestreNivel,
  };
}

export async function listarTurmasBackend(): Promise<TurmaBackendUI[]> {
  const dados = await apiFetch<TurmaBackend[]>('/api/turmas');
  return dados.map(paraUI);
}

export async function criarTurmaBackend(f: TurmaFormData): Promise<TurmaBackendUI> {
  const nova = await apiFetch<TurmaBackend>('/api/turmas', {
    method: 'POST',
    body: JSON.stringify(paraBackend(f)),
  });
  return paraUI(nova);
}

export async function atualizarTurmaBackend(id: number, f: TurmaFormData): Promise<TurmaBackendUI> {
  const atualizada = await apiFetch<TurmaBackend>(`/api/turmas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(paraBackend(f)),
  });
  return paraUI(atualizada);
}

export async function removerTurmaBackend(id: number): Promise<void> {
  await apiFetch<void>(`/api/turmas/${id}`, { method: 'DELETE' });
}
