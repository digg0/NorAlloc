import { apiFetch } from './api';

export interface CoordenadorUI {
  id: number;
  nome: string;
  email: string;
  cursoId: number;
  professorId: number | null;
  ativo: boolean;
}

export interface CoordenadorFormData {
  cursoId: number;
  professorId: number;
  password?: string;
}

interface CoordenadorBackend {
  id: number;
  nome: string;
  email: string;
  curso_id: number;
  professor_id: number | null;
  ativo: boolean;
}

function paraUI(c: CoordenadorBackend): CoordenadorUI {
  return { id: c.id, nome: c.nome, email: c.email, cursoId: c.curso_id, professorId: c.professor_id, ativo: c.ativo };
}

export async function listarCoordenadores(): Promise<CoordenadorUI[]> {
  const dados = await apiFetch<CoordenadorBackend[]>('/api/coordenadores');
  return dados.map(paraUI);
}

/** Torna o professor selecionado em `f.professorId` coordenador do curso. */
export async function criarCoordenador(f: CoordenadorFormData): Promise<CoordenadorUI> {
  const novo = await apiFetch<CoordenadorBackend>('/api/coordenadores', {
    method: 'POST',
    body: JSON.stringify({
      professor_id: f.professorId,
      curso_id: f.cursoId,
      password: f.password || undefined,
    }),
  });
  return paraUI(novo);
}

/** Atualiza curso/senha, ou substitui qual professor coordena (envie um
 * `professorId` diferente do atual). */
export async function atualizarCoordenador(id: number, f: Partial<CoordenadorFormData>): Promise<CoordenadorUI> {
  const body: Record<string, unknown> = {};
  if (f.cursoId !== undefined) body.curso_id = f.cursoId;
  if (f.professorId !== undefined) body.professor_id = f.professorId;
  if (f.password) body.password = f.password;
  const atualizado = await apiFetch<CoordenadorBackend>(`/api/coordenadores/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return paraUI(atualizado);
}

export async function removerCoordenador(id: number): Promise<void> {
  await apiFetch<void>(`/api/coordenadores/${id}`, { method: 'DELETE' });
}
