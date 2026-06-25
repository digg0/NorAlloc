// Grade-padrão de horários (IFCE Campus Tauá): usada para montar a visão
// completa do dia (aulas + intervalos + almoço/janta) tanto na tela de
// Disponibilidade de Turma quanto na Grade Horária.

export const DIAS_UTEIS = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA'] as const;

export const DIA_LABEL: Record<string, string> = {
  SEGUNDA: 'Segunda',
  TERCA: 'Terça',
  QUARTA: 'Quarta',
  QUINTA: 'Quinta',
  SEXTA: 'Sexta',
  SABADO: 'Sábado',
};

export type LinhaGrade =
  | { tipo: 'aula'; turno: string; horaInicio: string; horaFim: string }
  | { tipo: 'pausa'; label: string; horaInicio: string; horaFim: string };

// Ordem cronológica completa do dia, incluindo os intervalos/almoço/janta
// como linhas não-clicáveis (servem só de referência visual na grade).
export const LINHAS_GRADE_PADRAO: LinhaGrade[] = [
  { tipo: 'aula', turno: 'MANHA', horaInicio: '07:25', horaFim: '08:25' },
  { tipo: 'aula', turno: 'MANHA', horaInicio: '08:25', horaFim: '09:25' },
  { tipo: 'pausa', label: 'Intervalo', horaInicio: '09:25', horaFim: '09:45' },
  { tipo: 'aula', turno: 'MANHA', horaInicio: '09:45', horaFim: '10:45' },
  { tipo: 'aula', turno: 'MANHA', horaInicio: '10:45', horaFim: '11:45' },
  { tipo: 'pausa', label: 'Almoço', horaInicio: '11:45', horaFim: '13:00' },
  { tipo: 'aula', turno: 'TARDE', horaInicio: '13:00', horaFim: '14:00' },
  { tipo: 'aula', turno: 'TARDE', horaInicio: '14:00', horaFim: '15:00' },
  { tipo: 'pausa', label: 'Intervalo', horaInicio: '15:00', horaFim: '15:20' },
  { tipo: 'aula', turno: 'TARDE', horaInicio: '15:20', horaFim: '16:20' },
  { tipo: 'aula', turno: 'TARDE', horaInicio: '16:20', horaFim: '17:20' },
  { tipo: 'pausa', label: 'Janta', horaInicio: '17:20', horaFim: '18:20' },
  { tipo: 'aula', turno: 'NOITE', horaInicio: '18:20', horaFim: '19:10' },
  { tipo: 'aula', turno: 'NOITE', horaInicio: '19:10', horaFim: '20:00' },
  { tipo: 'pausa', label: 'Intervalo', horaInicio: '20:00', horaFim: '20:10' },
  { tipo: 'aula', turno: 'NOITE', horaInicio: '20:10', horaFim: '21:00' },
  { tipo: 'aula', turno: 'NOITE', horaInicio: '21:00', horaFim: '21:50' },
  { tipo: 'aula', turno: 'NOITE', horaInicio: '21:50', horaFim: '22:40' },
];
