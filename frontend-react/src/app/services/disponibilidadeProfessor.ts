import { apiFetch, ApiError } from './api';

export interface DisponibilidadeProfessorUI {
  id: number;
  professorId: number;
  semestreId: number;
  horariosBloqueados: string[];
  limiteCargaHoraria: number;
}

interface DisponibilidadeBackend {
  id: number;
  professor_id: number;
  semestre_id: number;
  horarios_bloqueados: string[];
  limite_carga_horaria: number;
}

function paraUI(d: DisponibilidadeBackend): DisponibilidadeProfessorUI {
  return {
    id: d.id,
    professorId: d.professor_id,
    semestreId: d.semestre_id,
    horariosBloqueados: d.horarios_bloqueados,
    limiteCargaHoraria: d.limite_carga_horaria,
  };
}

/** Retorna null se o professor ainda não informou disponibilidade neste semestre. */
export async function obterDisponibilidade(
  professorId: number,
  semestreId: number
): Promise<DisponibilidadeProfessorUI | null> {
  try {
    const dados = await apiFetch<DisponibilidadeBackend>(
      `/api/professores/${professorId}/preferencias?semestre_id=${semestreId}`
    );
    return paraUI(dados);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/** Cria ou atualiza (upsert) a disponibilidade do professor para o semestre. */
export async function salvarDisponibilidade(
  professorId: number,
  semestreId: number,
  horariosBloqueados: string[],
  limiteCargaHoraria: number
): Promise<DisponibilidadeProfessorUI> {
  const dados = await apiFetch<DisponibilidadeBackend>(`/api/professores/${professorId}/preferencias`, {
    method: 'POST',
    body: JSON.stringify({
      semestre_id: semestreId,
      horarios_bloqueados: horariosBloqueados,
      limite_carga_horaria: limiteCargaHoraria,
    }),
  });
  return paraUI(dados);
}
