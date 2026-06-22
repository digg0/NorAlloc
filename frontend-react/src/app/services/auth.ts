import { apiFetch, setToken } from './api';

export type Papel = 'Administrador' | 'Coordenador' | 'Professor';

interface UsuarioBackend {
  id: number;
  nome: string;
  email: string;
  tipo: string;
}

interface LoginBackendResponse {
  acesso_token: string;
  token_tipo: string;
  usuario: UsuarioBackend;
}

// Sessão usada pelo App (campos já no formato que o frontend espera).
export interface SessaoUsuario {
  id: number;
  name: string;
  email: string;
  role: Papel;
  initials: string;
}

const TIPO_PARA_ROLE: Record<string, Papel> = {
  ADMIN: 'Administrador',
  COORDENADOR: 'Coordenador',
  PROFESSOR: 'Professor',
};

const USER_KEY = 'noralloc_user';

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

export async function login(email: string, senha: string): Promise<SessaoUsuario> {
  const resp = await apiFetch<LoginBackendResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });

  setToken(resp.acesso_token);

  const u = resp.usuario;
  const sessao: SessaoUsuario = {
    id: u.id,
    name: u.nome,
    email: u.email,
    role: TIPO_PARA_ROLE[u.tipo] ?? 'Coordenador',
    initials: iniciais(u.nome),
  };

  localStorage.setItem(USER_KEY, JSON.stringify(sessao));
  return sessao;
}

export function logout(): void {
  setToken(null);
  localStorage.removeItem(USER_KEY);
}

export function getSessao(): SessaoUsuario | null {
  const bruto = localStorage.getItem(USER_KEY);
  if (!bruto) return null;
  try {
    return JSON.parse(bruto) as SessaoUsuario;
  } catch {
    return null;
  }
}
