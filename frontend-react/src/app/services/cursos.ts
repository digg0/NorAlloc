import { apiFetch } from './api';

export interface CursoUI {
  id: number;
  nome: string;
  nivel: string;
  ativo: boolean;
}

export interface CursoFormData {
  nome: string;
  nivel: string;
}

export async function listarCursos(): Promise<CursoUI[]> {
  return apiFetch<CursoUI[]>('/api/cursos');
}

export async function criarCurso(f: CursoFormData): Promise<CursoUI> {
  return apiFetch<CursoUI>('/api/cursos', {
    method: 'POST',
    body: JSON.stringify(f),
  });
}

export async function atualizarCurso(id: number, f: Partial<CursoFormData>): Promise<CursoUI> {
  return apiFetch<CursoUI>(`/api/cursos/id/${id}`, {
    method: 'PUT',
    body: JSON.stringify(f),
  });
}

export async function inativarCurso(id: number): Promise<CursoUI> {
  return apiFetch<CursoUI>(`/api/cursos/id/${id}`, { method: 'DELETE' });
}

export async function reativarCurso(id: number): Promise<CursoUI> {
  return apiFetch<CursoUI>(`/api/cursos/id/${id}/reativar`, { method: 'PUT' });
}
