import { apiFetch } from './api';

export interface SemestreResumo {
  id: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
  status: string;
}

// Dashboard de admin/coordenador (contagens gerais).
export interface ResumoGeral {
  professores: { total: number; de: number; h40: number; h20: number };
  disciplinas: number;
  cursos: number;
  turmas: number;
  coordenadores: number;
  ofertas: number;
  semestres: SemestreResumo[];
  semestre_atual: SemestreResumo | null;
}

// Dashboard do professor logado.
export interface ResumoProfessor {
  tem_cadastro: boolean;
  nome: string | null;
  regime_trabalho: string | null;
  carga_maxima: number | null;
  disciplinas_atribuidas: number;
  preferencias: number;
}

export async function getResumoGeral(): Promise<ResumoGeral> {
  return apiFetch<ResumoGeral>('/api/dashboard/geral');
}

export async function getResumoProfessor(): Promise<ResumoProfessor> {
  return apiFetch<ResumoProfessor>('/api/dashboard/professor');
}
