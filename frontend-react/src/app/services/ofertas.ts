import { apiFetch } from './api';

export interface OfertaUI {
  id: number;
  turmaId: number;
  disciplinaId: number;
  professorId: number | null;
  cargaHoraria: number;
}

export interface OfertaFormData {
  turmaId: number;
  disciplinaId: number;
  professorId: number | null;
  cargaHoraria: number;
}

interface OfertaBackend {
  id: number;
  turma_id: number;
  disciplina_id: number;
  professor_id: number | null;
  carga_horaria: number;
}

function paraUI(o: OfertaBackend): OfertaUI {
  return {
    id: o.id,
    turmaId: o.turma_id,
    disciplinaId: o.disciplina_id,
    professorId: o.professor_id,
    cargaHoraria: o.carga_horaria,
  };
}

function paraBackend(f: OfertaFormData) {
  return {
    turma_id: f.turmaId,
    disciplina_id: f.disciplinaId,
    professor_id: f.professorId,
    carga_horaria: f.cargaHoraria,
  };
}

export async function listarOfertas(filtros?: { turmaId?: number; professorId?: number }): Promise<OfertaUI[]> {
  const params = new URLSearchParams();
  if (filtros?.turmaId) params.set('turma_id', String(filtros.turmaId));
  if (filtros?.professorId) params.set('professor_id', String(filtros.professorId));
  const query = params.toString();
  const dados = await apiFetch<OfertaBackend[]>(`/api/ofertas${query ? `?${query}` : ''}`);
  return dados.map(paraUI);
}

export async function criarOferta(f: OfertaFormData): Promise<OfertaUI> {
  const nova = await apiFetch<OfertaBackend>('/api/ofertas', {
    method: 'POST',
    body: JSON.stringify(paraBackend(f)),
  });
  return paraUI(nova);
}

export async function atualizarOferta(id: number, f: OfertaFormData): Promise<OfertaUI> {
  const atualizada = await apiFetch<OfertaBackend>(`/api/ofertas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(paraBackend(f)),
  });
  return paraUI(atualizada);
}

export async function removerOferta(id: number): Promise<void> {
  await apiFetch<void>(`/api/ofertas/${id}`, { method: 'DELETE' });
}
