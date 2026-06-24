import { apiFetch } from './api';

// Formato vindo do backend (snake_case).
interface DisciplinaBackend {
  id: number;
  curso_id: number;
  nome: string;
  carga_horaria: number;
}

// Formato usado na UI (igual ao type Disciplina do App.tsx).
export interface DisciplinaUI {
  id: number;
  nome: string;
  sigla: string;
  cargaHorariaCreditos: number;
  cursoId: number;
}

export interface DisciplinaFormData {
  nome: string;
  sigla: string;
  cargaHorariaCreditos: number;
  cursoId: number;
}

const STOPWORDS = new Set(['e', 'de', 'da', 'do', 'das', 'dos', 'para', 'a', 'o']);

// O backend não persiste sigla; derivamos das iniciais do nome para exibição.
function derivarSigla(nome: string): string {
  const palavras = nome.split(/\s+/).filter(p => p && !STOPWORDS.has(p.toLowerCase()));
  const iniciais = palavras.map(p => p[0]).join('').toUpperCase();
  return iniciais.length >= 2 ? iniciais.slice(0, 5) : nome.slice(0, 4).toUpperCase();
}

function paraUI(d: DisciplinaBackend): DisciplinaUI {
  return {
    id: d.id,
    nome: d.nome,
    sigla: derivarSigla(d.nome),
    cargaHorariaCreditos: d.carga_horaria,
    cursoId: d.curso_id,
  };
}

function paraBackend(f: DisciplinaFormData) {
  return {
    nome: f.nome,
    carga_horaria: f.cargaHorariaCreditos,
    curso_id: f.cursoId,
  };
}

export async function listarDisciplinas(): Promise<DisciplinaUI[]> {
  const dados = await apiFetch<DisciplinaBackend[]>('/api/disciplinas');
  return dados.map(paraUI);
}

export async function criarDisciplina(f: DisciplinaFormData): Promise<DisciplinaUI> {
  const nova = await apiFetch<DisciplinaBackend>('/api/disciplinas', {
    method: 'POST',
    body: JSON.stringify(paraBackend(f)),
  });
  return paraUI(nova);
}

export async function atualizarDisciplina(id: number, f: DisciplinaFormData): Promise<DisciplinaUI> {
  const atualizada = await apiFetch<DisciplinaBackend>(`/api/disciplinas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(paraBackend(f)),
  });
  return paraUI(atualizada);
}

export async function removerDisciplina(id: number): Promise<void> {
  await apiFetch<void>(`/api/disciplinas/${id}`, { method: 'DELETE' });
}
