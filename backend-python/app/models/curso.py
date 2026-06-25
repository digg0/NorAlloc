from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Boolean

from sqlalchemy.orm import relationship

from app.core.database import Base


class Curso(Base):

    __tablename__ = "cursos"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    nome = Column(
        String,
        nullable=False,
        unique=True
    )

    nivel = Column(
        String,
        nullable=False
    )

    ativo = Column(
        Boolean,
        nullable=False,
        default=True
    )

    disciplinas = relationship(
        "Disciplina",
        back_populates="curso"
    )