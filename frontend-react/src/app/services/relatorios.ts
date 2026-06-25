import { apiFetch, getToken } from './api';

export interface AlertaUI {
  tipo: string;
  descricao: string;
  entidadeTipo: string;
  entidadeId: number;
}

export interface AulaGradeUI {
  dia: string;
  horario: string;
  disciplina: string;
  professor: string;
}

export interface TurmaRelatorioUI {
  nome: string;
  grade: AulaGradeUI[];
}

export interface RelatorioUI {
  curso: string;
  semestre: string;
  coordenador: string | null;
  resumo: { turmas: number; disciplinas: number; professores: number; cargaTotal: number };
  turmas: TurmaRelatorioUI[];
  professoresEnvolvidos: string[];
  disciplinasOfertadas: string[];
  alertas: AlertaUI[];
}

interface RelatorioBackend {
  curso: string;
  semestre: string;
  coordenador: string | null;
  resumo: { turmas: number; disciplinas: number; professores: number; carga_total: number };
  turmas: { nome: string; grade: { dia: string; horario: string; disciplina: string; professor: string }[] }[];
  professores_envolvidos: string[];
  disciplinas_ofertadas: string[];
  alertas: { tipo: string; descricao: string; entidade_tipo: string; entidade_id: number }[];
}

function paraUI(r: RelatorioBackend): RelatorioUI {
  return {
    curso: r.curso,
    semestre: r.semestre,
    coordenador: r.coordenador,
    resumo: {
      turmas: r.resumo.turmas,
      disciplinas: r.resumo.disciplinas,
      professores: r.resumo.professores,
      cargaTotal: r.resumo.carga_total,
    },
    turmas: r.turmas,
    professoresEnvolvidos: r.professores_envolvidos,
    disciplinasOfertadas: r.disciplinas_ofertadas,
    alertas: r.alertas.map((a) => ({
      tipo: a.tipo,
      descricao: a.descricao,
      entidadeTipo: a.entidade_tipo,
      entidadeId: a.entidade_id,
    })),
  };
}

export async function getRelatorio(cursoId: number, semestreId: number): Promise<RelatorioUI> {
  const dados = await apiFetch<RelatorioBackend>(`/api/relatorios/curso/${cursoId}/semestre/${semestreId}`);
  return paraUI(dados);
}

const BASE_URL =
  ((import.meta as any).env?.VITE_API_URL as string | undefined) || 'http://localhost:8000';

export async function baixarRelatorioPdf(cursoId: number, semestreId: number): Promise<void> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/api/relatorios/curso/${cursoId}/semestre/${semestreId}/pdf`, { headers });
  if (!res.ok) {
    throw new Error(`Não foi possível gerar o PDF (erro ${res.status}).`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `relatorio_curso_${cursoId}_semestre_${semestreId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
