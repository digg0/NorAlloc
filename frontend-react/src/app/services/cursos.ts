import { apiFetch } from './api';

interface CursoBackend {
  id: number;
  nome: string;
  nivel?: string;
}

export interface CursoUI {
  id: number;
  sigla: string;
  nome: string;
  nivel?: string;
}

export interface CursoFormData {
  nome: string;
  nivel: string;
}

const STOPWORDS = new Set(['e', 'de', 'da', 'do', 'das', 'dos', 'para', 'a', 'o']);

function derivarSigla(nome: string): string {
  const palavras = nome.split(/\s+/).filter(p => p && !STOPWORDS.has(p.toLowerCase()));
  const iniciais = palavras.map(p => p[0]).join('').toUpperCase();
  if (iniciais.length >= 2) return iniciais;
  return nome.slice(0, 4).toUpperCase();
}

function paraUI(c: CursoBackend): CursoUI {
  return { id: c.id, nome: c.nome, nivel: c.nivel, sigla: derivarSigla(c.nome) };
}

export async function listarCursos(): Promise<CursoUI[]> {
  const dados = await apiFetch<CursoBackend[]>('/api/cursos');
  return dados.map(paraUI);
}

export async function criarCurso(dados: CursoFormData): Promise<CursoUI> {
  const curso = await apiFetch<CursoBackend>('/api/cursos', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
  return paraUI(curso);
}
