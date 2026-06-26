import { apiFetch, ApiError } from './api';

export interface MeuCoordenadorUI {
  id: number;
  nome: string;
  email: string;
  cursoId: number;
  ativo: boolean;
}

interface CoordenadorBackend {
  id: number;
  nome: string;
  email: string;
  curso_id: number;
  ativo: boolean;
}

export async function getMeuCoordenador(): Promise<MeuCoordenadorUI | null> {
  try {
    const c = await apiFetch<CoordenadorBackend>('/api/coordenadores/me');
    return { id: c.id, nome: c.nome, email: c.email, cursoId: c.curso_id, ativo: c.ativo };
  } catch (err) {
    if (err instanceof ApiError && (err.status === 403 || err.status === 404)) return null;
    throw err;
  }
}
