from sqlalchemy import Column, Integer, String, Time, UniqueConstraint
from app.core.database import Base


class Horario(Base):
    __tablename__ = "horarios"

    id = Column(Integer, primary_key=True, index=True)
    turno = Column(String(10), nullable=False)
    hora_inicio = Column(Time, nullable=False)
    hora_fim = Column(Time, nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "turno", "hora_inicio", "hora_fim", name="uq_horario_turno_inicio_fim"
        ),
    )