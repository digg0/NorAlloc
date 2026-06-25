from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Professor(Base):
    __tablename__ = "professores"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    nome = Column(String, nullable=False)
    email = Column(String, index=True, nullable=True)
    regime_trabalho = Column(String, nullable=False)
    area = Column(String, nullable=True)
    carga_maxima = Column(Integer, nullable=True)

    situacao = Column(String, nullable=False, default="ativo")
    carga_disponivel = Column(Integer, nullable=True)
    data_inicio_situacao = Column(Date, nullable=True)
    data_fim_situacao = Column(Date, nullable=True)
    observacao_situacao = Column(String, nullable=True)

    usuario = relationship("Usuario")
