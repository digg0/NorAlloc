from sqlalchemy import Column, Integer, String, Boolean
from app.core.database import Base

class Coordenador(Base):
    __tablename__ = "coordenadores"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    curso_id = Column(Integer, index=True, nullable=False)
    
    
    ativo = Column(Boolean, default=True, nullable=False)