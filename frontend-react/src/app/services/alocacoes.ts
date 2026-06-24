import { apiFetch } from './api';

interface AlocacaoBackend {
  id: number;
  oferta_id: number;
  horario_id: number;
  professor?: string;
  professor_id?: number | null;
  disciplina?: string;
  turma?: string;
  dia?: string;
  slot?: string;
  horario?: string;
}

export interface AlocacaoUI {
  id: number;
  ofertaId: number;
  horarioId: number;
  professorId?: number | null;
  professor?: string;
  disciplina?: string;
  turma?: string;
  dia?: string;
  slot?: string;
  horario?: string;
}

interface GerarGradeResponse {
  sucesso: boolean;
  mensagem: string;
  total_alocacoes: number;
}

function paraUI(a: AlocacaoBackend): AlocacaoUI {
  return {
    id: a.id,
    ofertaId: a.oferta_id,
    horarioId: a.horario_id,
    professorId: a.professor_id ?? null,
    professor: a.professor,
    disciplina: a.disciplina,
    turma: a.turma,
    dia: a.dia,
    slot: a.slot,
    horario: a.horario,
  };
}

export async function listarAlocacoes(): Promise<AlocacaoUI[]> {
  const dados = await apiFetch<AlocacaoBackend[]>('/alocacoes/');
  return Array.isArray(dados) ? dados.map(paraUI) : [];
}

export async function gerarGrade(semestreId: number): Promise<GerarGradeResponse> {
  return apiFetch<GerarGradeResponse>(`/alocacoes/gerar-grade?semestre_id=${semestreId}`, { method: 'POST' });
}
