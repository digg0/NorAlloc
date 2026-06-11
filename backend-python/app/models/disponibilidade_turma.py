from sqlalchemy import (
    Column,
    Integer,
    Boolean,
    ForeignKey
)

from sqlalchemy.orm import relationship

from app.core.database import Base


class DisponibilidadeTurma(Base):

    __tablename__ = "disponibilidade_turma"

    id = Column(Integer, primary_key=True)

    turma_id = Column(
        Integer,
        ForeignKey("turmas.id")
    )

    horario_id = Column(
        Integer,
        ForeignKey("horarios.id")
    )

    disponivel = Column(Boolean, default=True)

    turma = relationship("Turma")

    horario = relationship("Horario")