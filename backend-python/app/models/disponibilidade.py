from sqlalchemy import Column, Integer, JSON, UniqueConstraint
from app.core.database import Base


class Restricao(Base):
    """Disponibilidade informada por um professor para um semestre.

    Cada professor possui no máximo uma restrição por semestre (chave de
    negócio: professor_id + semestre_id). Os horários bloqueados ficam em uma
    coluna JSON (lista de códigos no padrão DIA_SLOT, ex.: "SEG_M1").

    Obs.: professor_id e semestre_id são inteiros indexados (sem FK rígida),
    seguindo o mesmo padrão de `coordenadores.curso_id`. Quando as tabelas
    `professores` e `semestres` existirem, dá para adicionar ForeignKey aqui.
    """

    __tablename__ = "restricoes"

    id = Column(Integer, primary_key=True, index=True)
    professor_id = Column(Integer, index=True, nullable=False)
    semestre_id = Column(Integer, index=True, nullable=False)

    
    horarios_bloqueados = Column(JSON, nullable=False, default=list)

    
    limite_carga_horaria = Column(Integer, nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "professor_id", "semestre_id", name="uq_restricao_professor_semestre"
        ),
    )