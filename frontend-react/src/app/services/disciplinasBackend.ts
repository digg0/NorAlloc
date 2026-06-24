import { apiFetch } from './api';

export interface DisciplinaBackendUI {
  id: number;
  nome: string;
  cursoId: number;
  cargaHoraria: number;
}

interface DisciplinaBackend {
  id: number;
  nome: string;
  curso_id: number;
  carga_horaria: number;
}

function paraUI(d: DisciplinaBackend): DisciplinaBackendUI {
  return { id: d.id, nome: d.nome, cursoId: d.curso_id, cargaHoraria: d.carga_horaria };
}

export async function listarDisciplinasBackend(): Promise<DisciplinaBackendUI[]> {
  const dados = await apiFetch<DisciplinaBackend[]>('/api/disciplinas');
  return dados.map(paraUI);
}
