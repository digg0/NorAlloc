import { apiFetch } from './api';

export interface CursoUI {
  id: number;
  nome: string;
  nivel: string;
}

export async function listarCursos(): Promise<CursoUI[]> {
  return apiFetch<CursoUI[]>('/api/cursos');
}
