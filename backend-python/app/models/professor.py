from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Professor(Base):
    __tablename__ = "professores"

    id = Column(Integer, primary_key=True, index=True)
    # Vínculo opcional com uma conta de login (usuarios). Um docente pode ser
    # cadastrado pelo admin sem ter, ainda, uma conta de acesso.
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    nome = Column(String, nullable=False)
    email = Column(String, index=True, nullable=True)
    regime_trabalho = Column(String, nullable=False)
    area = Column(String, nullable=True)
    carga_maxima = Column(Integer, nullable=True)

    usuario = relationship("Usuario")
