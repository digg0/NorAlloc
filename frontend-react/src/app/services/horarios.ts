import { apiFetch } from './api';

export interface HorarioUI {
  id: number;
  diaSemana: string;
  turno: string;
  horaInicio: string;
  horaFim: string;
}

interface HorarioBackend {
  id: number;
  dia_semana: string;
  turno: string;
  hora_inicio: string;
  hora_fim: string;
}

function paraUI(h: HorarioBackend): HorarioUI {
  return { id: h.id, diaSemana: h.dia_semana, turno: h.turno, horaInicio: h.hora_inicio, horaFim: h.hora_fim };
}

export const DIAS_SEMANA = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'] as const;

export async function listarHorarios(): Promise<HorarioUI[]> {
  const dados = await apiFetch<HorarioBackend[]>('/api/horarios');
  return dados.map(paraUI);
}
