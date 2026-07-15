import { apiFetch, ApiError } from './api';

/**
 * Preferências de alocação do professor — alimentam as restrições soft/hard do
 * solver Z3 (preferir manhã, aula dupla, evitar janelas/sexta, mín./máx. de
 * aulas por dia). Backend: /api/preferencias-aula/{professorId}/preferencias.
 */
export interface PreferenciasProfessorUI {
  prefereAulaDupla: boolean;
  evitarJanelas: boolean;
  evitarSexta: boolean;
  prefereManha: boolean;
  maxAulasDia: number | null;
  minAulasDia: number | null;
}

interface PreferenciasBackend {
  id: number;
  professor_id: number;
  prefere_aula_dupla: boolean | null;
  evitar_janelas: boolean | null;
  evitar_sexta: boolean | null;
  prefere_manha: boolean | null;
  max_aulas_dia: number | null;
  min_aulas_dia: number | null;
}

export const PREFERENCIAS_PADRAO: PreferenciasProfessorUI = {
  prefereAulaDupla: false,
  evitarJanelas: false,
  evitarSexta: false,
  prefereManha: false,
  maxAulasDia: null,
  minAulasDia: null,
};

function paraUI(p: PreferenciasBackend): PreferenciasProfessorUI {
  return {
    prefereAulaDupla: p.prefere_aula_dupla ?? false,
    evitarJanelas: p.evitar_janelas ?? false,
    evitarSexta: p.evitar_sexta ?? false,
    prefereManha: p.prefere_manha ?? false,
    maxAulasDia: p.max_aulas_dia ?? null,
    minAulasDia: p.min_aulas_dia ?? null,
  };
}

function paraBackend(p: PreferenciasProfessorUI) {
  return {
    prefere_aula_dupla: p.prefereAulaDupla,
    evitar_janelas: p.evitarJanelas,
    evitar_sexta: p.evitarSexta,
    prefere_manha: p.prefereManha,
    max_aulas_dia: p.maxAulasDia,
    min_aulas_dia: p.minAulasDia,
  };
}

/** Retorna null se o professor ainda não registrou preferências. */
export async function obterPreferencias(
  professorId: number
): Promise<PreferenciasProfessorUI | null> {
  try {
    const dados = await apiFetch<PreferenciasBackend>(
      `/api/preferencias-aula/${professorId}/preferencias`
    );
    return paraUI(dados);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/**
 * Cria ou atualiza (upsert) as preferências do professor. O backend usa POST
 * para criar e PUT para atualizar, então descobrimos o que já existe primeiro.
 */
export async function salvarPreferencias(
  professorId: number,
  prefs: PreferenciasProfessorUI
): Promise<PreferenciasProfessorUI> {
  const existente = await obterPreferencias(professorId);
  const dados = await apiFetch<PreferenciasBackend>(
    `/api/preferencias-aula/${professorId}/preferencias`,
    {
      method: existente ? 'PUT' : 'POST',
      body: JSON.stringify(paraBackend(prefs)),
    }
  );
  return paraUI(dados);
}
