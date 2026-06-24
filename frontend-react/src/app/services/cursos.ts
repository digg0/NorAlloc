import { apiFetch } from './api';

// Formato vindo do backend.
interface CursoBackend {
  id: number;
  nome: string;
  nivel: string;
}

// Formato usado na UI (igual ao type Curso do App.tsx).
export interface CursoUI {
  id: number;
  sigla: string;
  nome: string;
}

const STOPWORDS = new Set(['e', 'de', 'da', 'do', 'das', 'dos', 'para', 'a', 'o']);

// O backend não guarda sigla; derivamos uma a partir do nome (iniciais das
// palavras significativas) só para exibição compacta nas tabelas.
function derivarSigla(nome: string): string {
  const palavras = nome
    .split(/\s+/)
    .filter(p => p && !STOPWORDS.has(p.toLowerCase()));
  const iniciais = palavras.map(p => p[0]).join('').toUpperCase();
  if (iniciais.length >= 2) return iniciais;
  return nome.slice(0, 4).toUpperCase();
}

function paraUI(c: CursoBackend): CursoUI {
  return { id: c.id, nome: c.nome, sigla: derivarSigla(c.nome) };
}

export async function listarCursos(): Promise<CursoUI[]> {
  const dados = await apiFetch<CursoBackend[]>('/api/cursos');
  return dados.map(paraUI);
}
