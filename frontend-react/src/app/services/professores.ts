import { apiFetch } from './api';

export type RegimeTrabalho = 'DE' | '40H' | '20H';

interface ProfessorBackend {
  id: number;
  nome: string;
  email: string;
  regime_trabalho: string;
  area: string | null;
  carga_maxima: number | null;
  data_ingresso: string | null;
  data_nascimento: string | null;
}

export interface ProfessorUI {
  id: number;
  nome: string;
  email: string;
  regimeTrabalho: RegimeTrabalho;
  areaAtuacao: string;
  dataIngresso: string; // ISO 'YYYY-MM-DD' ou '' quando não informado
  dataNascimento: string;
}

export interface ProfessorFormData {
  nome: string;
  email: string;
  regimeTrabalho: RegimeTrabalho;
  areaAtuacao: string;
  senha: string; // cria/atualiza a conta de login (só enviado quando preenchido)
  dataIngresso: string; // usado no critério de desempate por antiguidade do solver
  dataNascimento: string;
}

const CARGA_POR_REGIME: Record<RegimeTrabalho, number> = {
  DE: 20,
  '40H': 40,
  '20H': 20,
};

function paraUI(p: ProfessorBackend): ProfessorUI {
  return {
    id: p.id,
    nome: p.nome,
    email: p.email,
    regimeTrabalho: (p.regime_trabalho as RegimeTrabalho) || 'DE',
    areaAtuacao: p.area ?? '',
    dataIngresso: p.data_ingresso ?? '',
    dataNascimento: p.data_nascimento ?? '',
  };
}

function paraBackend(f: ProfessorFormData) {
  const body: Record<string, unknown> = {
    nome: f.nome,
    email: f.email,
    regime_trabalho: f.regimeTrabalho,
    area: f.areaAtuacao || null,
    carga_maxima: CARGA_POR_REGIME[f.regimeTrabalho],
    data_ingresso: f.dataIngresso || null,
    data_nascimento: f.dataNascimento || null,
  };
  if (f.senha && f.senha.trim()) body.password = f.senha;
  return body;
}

export async function listarProfessores(): Promise<ProfessorUI[]> {
  const dados = await apiFetch<ProfessorBackend[]>('/api/professores');
  return dados.map(paraUI);
}

export async function criarProfessor(f: ProfessorFormData): Promise<ProfessorUI> {
  const novo = await apiFetch<ProfessorBackend>('/api/professores', {
    method: 'POST',
    body: JSON.stringify(paraBackend(f)),
  });
  return paraUI(novo);
}

export async function atualizarProfessor(
  id: number,
  f: ProfessorFormData
): Promise<ProfessorUI> {
  const atualizado = await apiFetch<ProfessorBackend>(`/api/professores/${id}`, {
    method: 'PUT',
    body: JSON.stringify(paraBackend(f)),
  });
  return paraUI(atualizado);
}

export async function removerProfessor(id: number): Promise<void> {
  await apiFetch<void>(`/api/professores/${id}`, { method: 'DELETE' });
}

export async function meuPerfilProfessor(): Promise<ProfessorUI> {
  const dados = await apiFetch<ProfessorBackend>('/api/professores/me');
  return paraUI(dados);
}
