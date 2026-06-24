import { apiFetch } from './api';

export interface TurmaBackendUI {
  id: number;
  nome: string;
  cursoId: number | null;
  semestreId: number | null;
  semestreNivel: number | null;
}

interface TurmaBackend {
  id: number;
  nome: string;
  curso_id: number | null;
  semestre_id: number | null;
  semestre_nivel: number | null;
}

function paraUI(t: TurmaBackend): TurmaBackendUI {
  return {
    id: t.id,
    nome: t.nome,
    cursoId: t.curso_id,
    semestreId: t.semestre_id,
    semestreNivel: t.semestre_nivel,
  };
}

export async function listarTurmasBackend(): Promise<TurmaBackendUI[]> {
  const dados = await apiFetch<TurmaBackend[]>('/api/turmas');
  return dados.map(paraUI);
}
