import { apiFetch } from './api';

export type StatusEtapa = 'OFERTAS' | 'RESTRICOES' | 'SIMULACAO' | 'CONCLUIDO';

interface SemestreBackend {
  id: number;
  nome: string;
  data_inicio: string; // ISO yyyy-mm-dd
  data_fim: string;
  status: string;
}

export interface SemestreUI {
  id: number;
  nome: string;
  dataInicio: string;
  dataTermino: string;
  statusEtapa: StatusEtapa;
}

export interface SemestreFormData {
  nome: string;
  dataInicio: string;
  dataTermino: string;
  statusEtapa: StatusEtapa;
}

const ETAPAS_VALIDAS: StatusEtapa[] = ['OFERTAS', 'RESTRICOES', 'SIMULACAO', 'CONCLUIDO'];

function paraUI(s: SemestreBackend): SemestreUI {
  const status = (s.status || '').toUpperCase() as StatusEtapa;
  return {
    id: s.id,
    nome: s.nome,
    dataInicio: s.data_inicio,
    dataTermino: s.data_fim,
    statusEtapa: ETAPAS_VALIDAS.includes(status) ? status : 'OFERTAS',
  };
}

function paraBackend(f: SemestreFormData) {
  return {
    nome: f.nome,
    data_inicio: f.dataInicio,
    data_fim: f.dataTermino,
    status: f.statusEtapa,
  };
}

export async function listarSemestres(): Promise<SemestreUI[]> {
  const dados = await apiFetch<SemestreBackend[]>('/api/semestres');
  return dados.map(paraUI);
}

export async function criarSemestre(f: SemestreFormData): Promise<SemestreUI> {
  const novo = await apiFetch<SemestreBackend>('/api/semestres', {
    method: 'POST',
    body: JSON.stringify(paraBackend(f)),
  });
  return paraUI(novo);
}

export async function atualizarSemestre(id: number, f: SemestreFormData): Promise<SemestreUI> {
  const atualizado = await apiFetch<SemestreBackend>(`/api/semestres/${id}`, {
    method: 'PUT',
    body: JSON.stringify(paraBackend(f)),
  });
  return paraUI(atualizado);
}

export async function removerSemestre(id: number): Promise<void> {
  await apiFetch<void>(`/api/semestres/${id}`, { method: 'DELETE' });
}
