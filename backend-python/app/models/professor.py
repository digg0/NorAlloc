from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import ForeignKey

from sqlalchemy.orm import relationship

from app.core.database import Base


class Professor(Base):

    __tablename__ = "professores"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    usuario_id = Column(
        Integer,
        ForeignKey("usuarios.id"),
        nullable=False
    )

    nome = Column(
        String,
        nullable=False
    )

    regime_trabalho = Column(
        String,
        nullable=False
    )

    carga_maxima = Column(
        Integer,
        nullable=False
    )

    usuario = relationship(
        "Usuario"
    )

    disponibilidades = relationship(
        "DisponibilidadeProfessor",
        back_populates="professor"
    )

    preferencias = relationship(
        "PreferenciaDocente",
        back_populates="professor"
    )

    aptidoes = relationship(
        "AptidaoDocente",
        back_populates="professor"
    )