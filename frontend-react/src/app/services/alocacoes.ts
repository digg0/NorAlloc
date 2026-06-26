import { apiFetch } from './api';

export interface AlocacaoUI {
  id: number;
  ofertaId: number;
  horarioId: number;
  oferta: OfertaBackendNested | null;
  horario: HorarioBackendNested | null;
}

interface HorarioBackendNested {
  id: number;
  dia_semana: string;
  turno: string;
  hora_inicio: string;
  hora_fim: string;
}

interface OfertaBackendNested {
  id: number;
  turma_id: number;
  disciplina_id: number;
  professor_id: number | null;
  carga_horaria: number;
}

interface AlocacaoBackend {
  id: number;
  oferta_id: number;
  horario_id: number;
  oferta: OfertaBackendNested | null;
  horario: HorarioBackendNested | null;
}

export interface AlertaUI {
  tipo: string;
  descricao: string;
  entidadeTipo: string;
  entidadeId: number;
}

interface AlertaBackend {
  tipo: string;
  descricao: string;
  entidade_tipo: string;
  entidade_id: number;
}

export interface GerarGradeResultadoUI {
  sucesso: boolean;
  mensagem: string;
  totalAlocacoes: number;
}

interface GerarGradeBackend {
  sucesso: boolean;
  mensagem: string;
  total_alocacoes: number;
}

function paraUI(a: AlocacaoBackend): AlocacaoUI {
  return { id: a.id, ofertaId: a.oferta_id, horarioId: a.horario_id, oferta: a.oferta, horario: a.horario };
}

export async function gerarGrade(semestreId: number): Promise<GerarGradeResultadoUI> {
  const resultado = await apiFetch<GerarGradeBackend>(`/alocacoes/gerar-grade?semestre_id=${semestreId}`, {
    method: 'POST',
  });
  return { sucesso: resultado.sucesso, mensagem: resultado.mensagem, totalAlocacoes: resultado.total_alocacoes };
}

export async function limparGrade(semestreId: number): Promise<number> {
  const resultado = await apiFetch<{ removidas: number }>(`/alocacoes/semestre/${semestreId}`, {
    method: 'DELETE',
  });
  return resultado.removidas;
}

export async function listarAlocacoesPorSemestre(semestreId: number): Promise<AlocacaoUI[]> {
  const dados = await apiFetch<AlocacaoBackend[]>(`/alocacoes/semestre/${semestreId}`);
  return dados.map(paraUI);
}

export async function listarAlocacoesPorProfessor(professorId: number): Promise<AlocacaoUI[]> {
  const dados = await apiFetch<AlocacaoBackend[]>(`/alocacoes/professor/${professorId}`);
  return dados.map(paraUI);
}

export async function moverAlocacao(alocacaoId: number, novoHorarioId: number): Promise<AlocacaoUI> {
  const atualizado = await apiFetch<AlocacaoBackend>(`/alocacoes/${alocacaoId}/mover`, {
    method: 'PATCH',
    body: JSON.stringify({ novo_horario_id: novoHorarioId }),
  });
  return paraUI(atualizado);
}

export async function removerAlocacao(alocacaoId: number): Promise<void> {
  await apiFetch<void>(`/alocacoes/${alocacaoId}`, { method: 'DELETE' });
}

export async function validarSemestre(semestreId: number): Promise<AlertaUI[]> {
  const dados = await apiFetch<AlertaBackend[]>(`/alocacoes/validar/${semestreId}`);
  return dados.map((a) => ({
    tipo: a.tipo,
    descricao: a.descricao,
    entidadeTipo: a.entidade_tipo,
    entidadeId: a.entidade_id,
  }));
}
