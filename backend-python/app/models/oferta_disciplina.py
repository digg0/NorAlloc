from sqlalchemy import (
    Column,
    Integer,
    ForeignKey
)

from sqlalchemy.orm import relationship

from app.core.database import Base


class OfertaDisciplina(Base):

    __tablename__ = "ofertas_disciplina"

    id = Column(Integer, primary_key=True)

    turma_id = Column(
        Integer,
        ForeignKey("turmas.id")
    )

    disciplina_id = Column(
        Integer,
        ForeignKey("disciplinas.id")
    )

    professor_id = Column(
        Integer,
        ForeignKey("professores.id")
    )

    carga_horaria = Column(Integer)

    turma = relationship("Turma")

    disciplina = relationship("Disciplina")

    professor = relationship("Professor")