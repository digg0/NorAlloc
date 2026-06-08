from sqlalchemy import Column, Integer, String, ForeignKey

from sqlalchemy.orm import relationship

from app.core.database import Base


class Turma(Base):

    __tablename__ = "turmas"

    id = Column(Integer, primary_key=True)

    nome = Column(String, nullable=False)

    semestre_nivel = Column(Integer)

    curso_id = Column(Integer, ForeignKey("cursos.id"))

    semestre_id = Column(Integer, ForeignKey("semestres.id"))

    curso = relationship("Curso")

    semestre = relationship("Semestre")