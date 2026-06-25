"""Regras de carga horária extraídas do NORMAS.pdf (IFCE Campus Tauá).

Cada aula (slot da grade) é 1 crédito. Pela manhã/tarde o crédito dura 60
minutos corridos e à noite 50 minutos — mas para fins de fiscalização da
carga horária do docente, o documento determina que TODO crédito (manhã,
tarde ou noite) seja contabilizado como 50 minutos. Por isso a conversão
de "número de aulas semanais" para "horas semanais" usa sempre 50 min.
"""

MINUTOS_POR_CREDITO = 50


def creditos_para_horas(creditos: int) -> float:
    """Converte um número de aulas/créditos semanais em horas, pela regra
    de 50 minutos por crédito do NORMAS.pdf."""
    return creditos * MINUTOS_POR_CREDITO / 60


def max_creditos_semanais(carga_maxima_horas: int) -> int:
    """Converte o limite de carga horária semanal (em horas) no número
    máximo de créditos/aulas equivalentes, pela mesma regra de 50 min."""
    return int((carga_maxima_horas * 60) // MINUTOS_POR_CREDITO)
