import { apiFetch } from './api';

export interface RelatorioResponse {
  curso: string;
  semestre: string;
  resumo: {
    turmas: number;
    disciplinas: number;
    professores: number;
    carga_total: number;
  };
  turmas: Array<{
    nome: string;
    grade: Array<{
      dia: string;
      horario: string;
      disciplina: string;
      professor: string;
    }>;
  }>;
  alertas: string[];
}

export async function emitirRelatorio(cursoId: number, semestreId: number): Promise<RelatorioResponse> {
  return apiFetch<RelatorioResponse>(`/api/relatorios/curso/${cursoId}/semestre/${semestreId}`);
}
