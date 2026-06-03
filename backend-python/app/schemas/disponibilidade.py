from pydantic import BaseModel, Field, ConfigDict
from typing import List

# ---------------------------------------------------------------------------
# Malha de horários do IFCE Campus Tauá (ver GET /api/configuracoes/turnos).
# Dias úteis + slots por turno. Usados para validar os horários bloqueados.
# ---------------------------------------------------------------------------
DIAS_SEMANA = {"SEG", "TER", "QUA", "QUI", "SEX", "SAB"}
SLOTS_AULA = {
    "M1", "M2", "M3", "M4",   # Manhã
    "T1", "T2", "T3", "T4",   # Tarde
    "N1", "N2", "N3", "N4",   # Noite
}


def validar_e_normalizar_horarios(horarios: List[str]) -> List[str]:
    """Valida os códigos no padrão DIA_SLOT e remove duplicatas.

    Levanta ValueError (traduzido para 400 no router) se algum código for
    inválido. Retorna a lista normalizada (maiúsculas, sem repetição).
    """
    normalizados: List[str] = []
    for item in horarios:
        if not isinstance(item, str) or "_" not in item:
            raise ValueError(
                f"Horário '{item}' fora do padrão. Use DIA_SLOT, ex.: 'SEG_M1'."
            )
        codigo = item.strip().upper()
        partes = codigo.split("_")
        if len(partes) != 2:
            raise ValueError(
                f"Horário '{item}' fora do padrão. Use DIA_SLOT, ex.: 'SEG_M1'."
            )
        dia, slot = partes
        if dia not in DIAS_SEMANA:
            raise ValueError(
                f"Dia inválido em '{item}'. Válidos: {', '.join(sorted(DIAS_SEMANA))}."
            )
        if slot not in SLOTS_AULA:
            raise ValueError(
                f"Slot inválido em '{item}'. Válidos: {', '.join(sorted(SLOTS_AULA))}."
            )
        if codigo not in normalizados:
            normalizados.append(codigo)
    return normalizados


class RestricaoBase(BaseModel):
    semestre_id: int = Field(..., gt=0, description="ID do semestre alvo")
    horarios_bloqueados: List[str] = Field(
        default_factory=list,
        description="Janelas indisponíveis no padrão DIA_SLOT, ex.: ['SEG_M1','TER_N2']",
    )
    limite_carga_horaria: int = Field(
        ..., gt=0, description="Máximo de carga horária aceita no semestre"
    )


class RestricaoCreate(RestricaoBase):
    """Corpo do POST /api/professores/{professor_id}/preferencias.

    O professor_id vem da URL (não do corpo).
    """


class RestricaoResponse(RestricaoBase):
    id: int
    professor_id: int

    model_config = ConfigDict(from_attributes=True)