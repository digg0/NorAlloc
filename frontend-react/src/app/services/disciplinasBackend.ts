import { apiFetch } from './api';

export interface DisciplinaBackendUI {
  id: number;
  nome: string;
  cursoId: number;
  cargaHoraria: number;
}

export interface DisciplinaFormData {
  nome: string;
  cursoId: number;
  cargaHoraria: number;
}

interface DisciplinaBackend {
  id: number;
  nome: string;
  curso_id: number;
  carga_horaria: number;
}

function paraUI(d: DisciplinaBackend): DisciplinaBackendUI {
  return { id: d.id, nome: d.nome, cursoId: d.curso_id, cargaHoraria: d.carga_horaria };
}

function paraBackend(f: DisciplinaFormData) {
  return { nome: f.nome, curso_id: f.cursoId, carga_horaria: f.cargaHoraria };
}

export async function listarDisciplinasBackend(): Promise<DisciplinaBackendUI[]> {
  const dados = await apiFetch<DisciplinaBackend[]>('/api/disciplinas');
  return dados.map(paraUI);
}

export async function criarDisciplinaBackend(f: DisciplinaFormData): Promise<DisciplinaBackendUI> {
  const nova = await apiFetch<DisciplinaBackend>('/api/disciplinas', {
    method: 'POST',
    body: JSON.stringify(paraBackend(f)),
  });
  return paraUI(nova);
}

export async function atualizarDisciplinaBackend(id: number, f: DisciplinaFormData): Promise<DisciplinaBackendUI> {
  const atualizada = await apiFetch<DisciplinaBackend>(`/api/disciplinas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(paraBackend(f)),
  });
  return paraUI(atualizada);
}

export async function removerDisciplinaBackend(id: number): Promise<void> {
  await apiFetch<void>(`/api/disciplinas/${id}`, { method: 'DELETE' });
}
