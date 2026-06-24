import { apiFetch } from './api';

// Formato vindo do backend.
interface CoordenadorBackend {
  id: number;
  nome: string;
  email: string;
  curso_id: number;
  ativo: boolean;
}

// Formato usado na UI (igual ao type Coordenador do App.tsx).
export interface CoordenadorUI {
  id: number;
  nome: string;
  email: string;
  cursoId: number;
  ativo: boolean;
}

export interface CoordenadorFormData {
  nome: string;
  email: string;
  senha: string; // só enviado na criação ou quando alterado
  cursoId: number;
}

function paraUI(c: CoordenadorBackend): CoordenadorUI {
  return {
    id: c.id,
    nome: c.nome,
    email: c.email,
    cursoId: c.curso_id,
    ativo: c.ativo,
  };
}

export async function listarCoordenadores(): Promise<CoordenadorUI[]> {
  const dados = await apiFetch<CoordenadorBackend[]>('/api/coordenadores');
  return dados.map(paraUI);
}

export async function criarCoordenador(f: CoordenadorFormData): Promise<CoordenadorUI> {
  const novo = await apiFetch<CoordenadorBackend>('/api/coordenadores', {
    method: 'POST',
    body: JSON.stringify({
      nome: f.nome,
      email: f.email,
      curso_id: f.cursoId,
      password: f.senha,
    }),
  });
  return paraUI(novo);
}

export async function atualizarCoordenador(
  id: number,
  f: CoordenadorFormData
): Promise<CoordenadorUI> {
  // Só inclui a senha quando o campo foi preenchido (evita reescrever o hash).
  const body: Record<string, unknown> = {
    nome: f.nome,
    email: f.email,
    curso_id: f.cursoId,
  };
  if (f.senha.trim()) body.password = f.senha;

  const atualizado = await apiFetch<CoordenadorBackend>(`/api/coordenadores/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return paraUI(atualizado);
}

export async function removerCoordenador(id: number): Promise<void> {
  await apiFetch<void>(`/api/coordenadores/${id}`, { method: 'DELETE' });
}
