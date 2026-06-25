from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import ForeignKey

from sqlalchemy.orm import relationship

from app.core.database import Base


class Disciplina(Base):

    __tablename__ = "disciplinas"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    curso_id = Column(
        Integer,
        ForeignKey("cursos.id"),
        nullable=False
    )

    nome = Column(
        String,
        nullable=False
    )

    # Código da disciplina na matriz curricular (ex.: "ADS01"). Pode faltar em
    # alguns currículos, então é opcional.
    codigo = Column(
        String,
        nullable=True
    )

    carga_horaria = Column(
        Integer,
        nullable=True
    )

    # Período/semestre da matriz (ano_semestre no currículo). Optativas ficam nulas.
    ano_semestre = Column(
        Integer,
        nullable=True
    )

    curso = relationship(
        "Curso",
        back_populates="disciplinas"
    )
