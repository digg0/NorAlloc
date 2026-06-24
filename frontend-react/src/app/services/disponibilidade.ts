import { apiFetch } from './api';

export interface DisponibilidadePayload {
  semestre_id: number;
  horarios_bloqueados: string[];
  limite_carga_horaria: number;
}

export interface DisponibilidadeResponse extends DisponibilidadePayload {
  id: number;
  professor_id: number;
}

export async function consultarDisponibilidade(professorId: number, semestreId: number): Promise<DisponibilidadeResponse> {
  return apiFetch<DisponibilidadeResponse>(`/api/professores/${professorId}/preferencias?semestre_id=${semestreId}`);
}

export async function salvarDisponibilidade(professorId: number, dados: DisponibilidadePayload): Promise<DisponibilidadeResponse> {
  return apiFetch<DisponibilidadeResponse>(`/api/professores/${professorId}/preferencias`, {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}
