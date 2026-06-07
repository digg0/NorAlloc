from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Disciplina(Base):
    __tablename__ = "disciplinas"

    id = Column(Integer, primary_key=True, index=True)
    
    curso_id = Column(Integer, ForeignKey("cursos.id"), nullable=False)
    
    nome = Column(String, nullable=False)
    carga_horaria = Column(Integer, nullable=False)

    curso = relationship("Curso", back_populates="disciplinas")
    aptidoes = relationship("AptidaoDocente", back_populates="disciplina")