from sqlalchemy import (
    Column,
    Integer,
    Boolean,
    ForeignKey
)

from sqlalchemy.orm import relationship

from app.core.database import Base


class PreferenciaProfessor(Base):

    __tablename__ = "preferencias_professor"

    id = Column(Integer, primary_key=True)

    professor_id = Column(
        Integer,
        ForeignKey("professores.id")
    )

    prefere_aula_dupla = Column(Boolean)

    evitar_janelas = Column(Boolean)

    evitar_sexta = Column(Boolean)

    prefere_manha = Column(Boolean)

    max_aulas_dia = Column(Integer)

    min_aulas_dia = Column(Integer)

    professor = relationship("Professor")