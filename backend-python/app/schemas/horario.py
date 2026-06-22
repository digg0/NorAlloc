from datetime import time
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, model_validator

TURNOS_VALIDOS = {"MANHA", "TARDE", "NOITE"}


class HorarioBase(BaseModel):
    turno: str = Field(..., description="Turno: MANHA, TARDE ou NOITE")
    hora_inicio: time = Field(..., description="Horário de início da aula (ex.: 07:30:00)")
    hora_fim: time = Field(..., description="Horário de fim da aula (ex.: 08:20:00)")

    @model_validator(mode="after")
    def validar(self) -> "HorarioBase":
        turno = self.turno.strip().upper()
        if turno not in TURNOS_VALIDOS:
            raise ValueError(
                f"Turno '{self.turno}' inválido. Válidos: {', '.join(sorted(TURNOS_VALIDOS))}."
            )
        self.turno = turno
        if self.hora_fim <= self.hora_inicio:
            raise ValueError("hora_fim deve ser posterior a hora_inicio.")
        return self


class HorarioCreate(HorarioBase):
    pass


class HorarioUpdate(BaseModel):
    turno: Optional[str] = Field(None, description="Turno: MANHA, TARDE ou NOITE")
    hora_inicio: Optional[time] = None
    hora_fim: Optional[time] = None

    @model_validator(mode="after")
    def validar_turno(self) -> "HorarioUpdate":
        if self.turno is not None:
            turno = self.turno.strip().upper()
            if turno not in TURNOS_VALIDOS:
                raise ValueError(
                    f"Turno '{self.turno}' inválido. Válidos: {', '.join(sorted(TURNOS_VALIDOS))}."
                )
            self.turno = turno
        if self.hora_inicio is not None and self.hora_fim is not None:
            if self.hora_fim <= self.hora_inicio:
                raise ValueError("hora_fim deve ser posterior a hora_inicio.")
        return self


class HorarioResponse(HorarioBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
