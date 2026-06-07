from sqlalchemy import Column, Integer, String
from app.core.database import Base

class Disciplina(Base):
    __tablename__ = "disciplinas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True, nullable=False)
    carga_horaria = Column(Integer, nullable=False)
    codigo = Column(String, unique=True, index=True, nullable=True)