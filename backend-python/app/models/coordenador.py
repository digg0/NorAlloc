from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.core.database import Base

class Coordenador(Base):
    __tablename__ = "coordenadores"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    curso_id = Column(Integer, index=True, nullable=False)

    # Vínculo com a conta de login (usuarios), para que o coordenador consiga
    # autenticar em /api/auth/login como os demais perfis (ADMIN/PROFESSOR).
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    ativo = Column(Boolean, default=True, nullable=False)