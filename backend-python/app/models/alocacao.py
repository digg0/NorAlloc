from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Alocacao(Base):

    __tablename__ = "alocacoes"

    id = Column(Integer, primary_key=True, index=True)

    oferta_id = Column(
        Integer,
        ForeignKey("ofertas_disciplina.id"),
        nullable=False
    )

    horario_id = Column(
        Integer,
        ForeignKey("horarios.id"),
        nullable=False
    )

    oferta = relationship(
        "OfertaDisciplina"
    )

    horario = relationship(
        "Horario"
    )