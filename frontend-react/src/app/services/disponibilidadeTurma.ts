import { apiFetch } from './api';

export interface DisponibilidadeTurmaUI {
  id: number;
  turmaId: number;
  horarioId: number;
  disponivel: boolean;
}

interface DisponibilidadeTurmaBackend {
  id: number;
  turma_id: number;
  horario_id: number;
  disponivel: boolean;
}

function paraUI(d: DisponibilidadeTurmaBackend): DisponibilidadeTurmaUI {
  return { id: d.id, turmaId: d.turma_id, horarioId: d.horario_id, disponivel: d.disponivel };
}

export async function listarDisponibilidadeTurma(): Promise<DisponibilidadeTurmaUI[]> {
  const dados = await apiFetch<DisponibilidadeTurmaBackend[]>('/api/disponibilidade-turmas');
  return dados.map(paraUI);
}

export async function criarDisponibilidadeTurma(turmaId: number, horarioId: number, disponivel: boolean): Promise<DisponibilidadeTurmaUI> {
  const novo = await apiFetch<DisponibilidadeTurmaBackend>('/api/disponibilidade-turmas', {
    method: 'POST',
    body: JSON.stringify({ turma_id: turmaId, horario_id: horarioId, disponivel }),
  });
  return paraUI(novo);
}

export async function atualizarDisponibilidadeTurma(
  id: number,
  turmaId: number,
  horarioId: number,
  disponivel: boolean
): Promise<DisponibilidadeTurmaUI> {
  const atualizado = await apiFetch<DisponibilidadeTurmaBackend>(`/api/disponibilidade-turmas/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ turma_id: turmaId, horario_id: horarioId, disponivel }),
  });
  return paraUI(atualizado);
}
