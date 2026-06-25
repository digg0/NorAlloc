import { apiFetch } from './api';

interface OfertaBackend {
  id: number;
  turma_id: number;
  disciplina_id: number;
  professor_id?: number | null;
  carga_horaria?: number | null;
}

export interface OfertaUI {
  id: number;
  turmaId: number;
  disciplinaId: number;
  professorId?: number | null;
  cargaHoraria?: number;
}

export interface OfertaFormData {
  turmaId: number;
  disciplinaId: number;
  professorId?: number | null;
  cargaHoraria?: number;
}

function paraUI(o: OfertaBackend): OfertaUI {
  return {
    id: o.id,
    turmaId: o.turma_id,
    disciplinaId: o.disciplina_id,
    professorId: o.professor_id ?? null,
    cargaHoraria: o.carga_horaria ?? undefined,
  };
}

function paraBackend(o: OfertaFormData) {
  return {
    turma_id: o.turmaId,
    disciplina_id: o.disciplinaId,
    professor_id: o.professorId ?? null,
    carga_horaria: o.cargaHoraria ?? null,
  };
}

export async function listarOfertas(): Promise<OfertaUI[]> {
  const dados = await apiFetch<OfertaBackend[]>('/api/ofertas');
  return dados.map(paraUI);
}

export async function criarOferta(dados: OfertaFormData): Promise<OfertaUI> {
  const oferta = await apiFetch<OfertaBackend>('/api/ofertas', {
    method: 'POST',
    body: JSON.stringify(paraBackend(dados)),
  });
  return paraUI(oferta);
}

export async function atualizarOferta(id: number, dados: Partial<OfertaFormData>): Promise<OfertaUI> {
  const body: Record<string, unknown> = {};
  if (dados.turmaId !== undefined) body.turma_id = dados.turmaId;
  if (dados.disciplinaId !== undefined) body.disciplina_id = dados.disciplinaId;
  if (dados.professorId !== undefined) body.professor_id = dados.professorId ?? null;
  if (dados.cargaHoraria !== undefined) body.carga_horaria = dados.cargaHoraria;
  const atualizada = await apiFetch<OfertaBackend>(`/api/ofertas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return paraUI(atualizada);
}

export async function removerOferta(id: number): Promise<void> {
  await apiFetch<void>(`/api/ofertas/${id}`, { method: 'DELETE' });
}
