export type Titulacao = 'Especialista' | 'Mestre' | 'Doutor';
export type TurnoType = 'Manhã' | 'Tarde' | 'Noite';
export type PrioridadeType = 'Alta' | 'Média' | 'Baixa';
export type StatusRestricao = 'Ativa' | 'Inativa';
export type StatusSemestre = 'ativo' | 'planejamento' | 'concluído';
export type TipoRestricao = 'Carga reduzida' | 'Preferência por turno' | 'Evitar turno' | 'Preferência por disciplina' | 'Evitar disciplina' | 'Indisponibilidade';

export interface Professor {
  id: string;
  nome: string;
  email: string;
  area: string;
  titulacao: Titulacao;
  cargaMaxima: number;
}

export interface Disciplina {
  id: string;
  codigo: string;
  nome: string;
  cargaHoraria: number;
  periodo: number;
  curso: string;
  turno: TurnoType;
}

export interface Restricao {
  id: string;
  professorId: string;
  professorNome: string;
  tipo: TipoRestricao;
  descricao: string;
  prioridade: PrioridadeType;
  status: StatusRestricao;
}

export interface Semestre {
  id: string;
  nome: string;
  codigo: string;
  dataInicio: string;
  dataFim: string;
  status: StatusSemestre;
  progresso: number;
  totalDisciplinas: number;
  alocacoesRealizadas: number;
  observacoes: string;
}

export interface Alocacao {
  id: string;
  professorId: string;
  professorNome: string;
  disciplinaId: string;
  disciplinaNome: string;
  semestreId: string;
  compatibilidade: number;
  turno: TurnoType;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const professoresMock: Professor[] = [
  { id: '1', nome: 'Samuel Costa', email: 'samuel.costa@ifce.edu.br', area: 'Ciência da Computação', titulacao: 'Doutor', cargaMaxima: 20 },
  { id: '2', nome: 'Ana Lima', email: 'ana.lima@ifce.edu.br', area: 'Matemática Aplicada', titulacao: 'Mestre', cargaMaxima: 20 },
  { id: '3', nome: 'Carlos Melo', email: 'carlos.melo@ifce.edu.br', area: 'Redes e Telecomunicações', titulacao: 'Doutor', cargaMaxima: 16 },
  { id: '4', nome: 'Patrícia Torres', email: 'patricia.torres@ifce.edu.br', area: 'Banco de Dados', titulacao: 'Mestre', cargaMaxima: 20 },
];

export const disciplinasMock: Disciplina[] = [
  { id: '1', codigo: 'ADS101', nome: 'Programação Orientada a Objeto', cargaHoraria: 80, periodo: 1, curso: 'ADS', turno: 'Manhã' },
  { id: '2', codigo: 'ADS102', nome: 'Banco de Dados', cargaHoraria: 80, periodo: 2, curso: 'ADS', turno: 'Manhã' },
  { id: '3', codigo: 'ADS103', nome: 'Redes de Computadores', cargaHoraria: 60, periodo: 3, curso: 'ADS', turno: 'Tarde' },
  { id: '4', codigo: 'ADS104', nome: 'Lógica de Programação', cargaHoraria: 80, periodo: 1, curso: 'ADS', turno: 'Manhã' },
  { id: '5', codigo: 'ADS105', nome: 'Estruturas de Dados', cargaHoraria: 80, periodo: 2, curso: 'ADS', turno: 'Tarde' },
  { id: '6', codigo: 'ADS106', nome: 'Sistemas Operacionais', cargaHoraria: 60, periodo: 3, curso: 'ADS', turno: 'Noite' },
  { id: '7', codigo: 'ADS107', nome: 'Engenharia de Software', cargaHoraria: 80, periodo: 4, curso: 'ADS', turno: 'Manhã' },
  { id: '8', codigo: 'ADS108', nome: 'Inteligência Artificial', cargaHoraria: 60, periodo: 5, curso: 'ADS', turno: 'Tarde' },
  { id: '9', codigo: 'ADS109', nome: 'Sistemas Distribuídos', cargaHoraria: 60, periodo: 5, curso: 'ADS', turno: 'Noite' },
  { id: '10', codigo: 'ADS110', nome: 'Laboratório de Programação', cargaHoraria: 80, periodo: 2, curso: 'ADS', turno: 'Manhã' },
];

export const restricoesMock: Restricao[] = [
  { id: '1', professorId: '1', professorNome: 'Samuel Costa', tipo: 'Carga reduzida', descricao: 'Limitado a 150 horas/aula devido ao acesso ao doutorado durante o semestre.', prioridade: 'Alta', status: 'Ativa' },
  { id: '2', professorId: '1', professorNome: 'Samuel Costa', tipo: 'Preferência por turno', descricao: 'Prefere ministrar aulas no período da manhã.', prioridade: 'Média', status: 'Ativa' },
  { id: '3', professorId: '1', professorNome: 'Samuel Costa', tipo: 'Evitar turno', descricao: 'Não disponível para aulas na Quarta-Feira à noite.', prioridade: 'Alta', status: 'Ativa' },
  { id: '4', professorId: '1', professorNome: 'Samuel Costa', tipo: 'Carga reduzida', descricao: 'Limite de 100h/semana por motivos de saúde.', prioridade: 'Alta', status: 'Ativa' },
  { id: '5', professorId: '2', professorNome: 'Ana Lima', tipo: 'Preferência por disciplina', descricao: 'Prefere disciplinas de Cálculo e Álgebra Linear.', prioridade: 'Média', status: 'Ativa' },
  { id: '6', professorId: '3', professorNome: 'Carlos Melo', tipo: 'Evitar turno', descricao: 'Não disponível às segundas-feiras pela manhã.', prioridade: 'Baixa', status: 'Inativa' },
];

export const semestresMock: Semestre[] = [
  {
    id: '1',
    nome: '2024.1',
    codigo: '2024.1',
    dataInicio: '04/02/2024',
    dataFim: '19/07/2024',
    status: 'ativo',
    progresso: 72,
    totalDisciplinas: 38,
    alocacoesRealizadas: 28,
    observacoes: 'Semestre com atenção especial para disciplinas noturnas.',
  },
  {
    id: '2',
    nome: '2023.2',
    codigo: '2023.2',
    dataInicio: '07/08/2023',
    dataFim: '17/12/2023',
    status: 'concluído',
    progresso: 100,
    totalDisciplinas: 42,
    alocacoesRealizadas: 42,
    observacoes: '',
  },
];

export const alocacoesMock: Alocacao[] = [
  { id: '1', professorId: '1', professorNome: 'Samuel Costa', disciplinaId: '1', disciplinaNome: 'Programação Orientada a Objeto', semestreId: '1', compatibilidade: 92, turno: 'Manhã' },
  { id: '2', professorId: '2', professorNome: 'Ana Lima', disciplinaId: '4', disciplinaNome: 'Lógica de Programação', semestreId: '1', compatibilidade: 88, turno: 'Manhã' },
  { id: '3', professorId: '3', professorNome: 'Carlos Melo', disciplinaId: '3', disciplinaNome: 'Redes de Computadores', semestreId: '1', compatibilidade: 95, turno: 'Tarde' },
  { id: '4', professorId: '4', professorNome: 'Patrícia Torres', disciplinaId: '2', disciplinaNome: 'Banco de Dados', semestreId: '1', compatibilidade: 97, turno: 'Manhã' },
  { id: '5', professorId: '1', professorNome: 'Samuel Costa', disciplinaId: '7', disciplinaNome: 'Engenharia de Software', semestreId: '1', compatibilidade: 84, turno: 'Manhã' },
  { id: '6', professorId: '4', professorNome: 'Patrícia Torres', disciplinaId: '5', disciplinaNome: 'Estruturas de Dados', semestreId: '1', compatibilidade: 79, turno: 'Tarde' },
];

export const tiposRestricao: TipoRestricao[] = [
  'Carga reduzida',
  'Preferência por turno',
  'Evitar turno',
  'Preferência por disciplina',
  'Evitar disciplina',
  'Indisponibilidade',
];
