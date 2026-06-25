import { apiFetch } from './api';

export interface SemestreUI {
  id: number;
  nome: string;
  dataInicio: string;
  dataFim: string;
  status: string;
}

interface SemestreBackend {
  id: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
  status: string;
}

export interface SemestreFormData {
  nome: string;
  dataInicio: string;
  dataFim: string;
  status: string;
}

function paraUI(s: SemestreBackend): SemestreUI {
  return {
    id: s.id,
    nome: s.nome,
    dataInicio: s.data_inicio,
    dataFim: s.data_fim,
    status: s.status,
  };
}

function paraBackend(f: SemestreFormData) {
  return { nome: f.nome, data_inicio: f.dataInicio, data_fim: f.dataFim, status: f.status };
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
