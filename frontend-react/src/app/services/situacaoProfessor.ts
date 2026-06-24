import { apiFetch } from './api';

export interface SituacaoProfessor {
  situacao: 'ativo' | 'afastado' | 'carga_reduzida';
  carga_disponivel: number;
  data_inicio?: string | null;
  data_fim?: string | null;
  observacao?: string | null;
}

export async function obterSituacaoProfessor(professorId: number): Promise<SituacaoProfessor> {
  return apiFetch<SituacaoProfessor>(`/api/professores/${professorId}/situacao`);
}

export async function salvarSituacaoProfessor(professorId: number, dados: SituacaoProfessor): Promise<SituacaoProfessor> {
  return apiFetch<SituacaoProfessor>(`/api/professores/${professorId}/situacao`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  });
}
