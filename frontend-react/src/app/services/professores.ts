import { apiFetch } from './api';

export type RegimeTrabalho = 'DE' | '40H' | '20H';

// Formato vindo do backend (snake_case).
interface ProfessorBackend {
  id: number;
  nome: string;
  email: string;
  regime_trabalho: string;
  area: string | null;
  carga_maxima: number | null;
}

// Formato usado na UI (igual ao type Professor do App.tsx).
export interface ProfessorUI {
  id: number;
  nome: string;
  email: string;
  regimeTrabalho: RegimeTrabalho;
  areaAtuacao: string;
}

export interface ProfessorFormData {
  nome: string;
  email: string;
  regimeTrabalho: RegimeTrabalho;
  areaAtuacao: string;
  senha: string; // cria/atualiza a conta de login (só enviado quando preenchido)
}

// Carga horária máxima derivada do regime (backend aceita opcional).
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
  };
}

function paraBackend(f: ProfessorFormData) {
  const body: Record<string, unknown> = {
    nome: f.nome,
    email: f.email,
    regime_trabalho: f.regimeTrabalho,
    area: f.areaAtuacao || null,
    carga_maxima: CARGA_POR_REGIME[f.regimeTrabalho],
  };
  // Só envia a senha quando preenchida (na edição, em branco = mantém a atual).
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
