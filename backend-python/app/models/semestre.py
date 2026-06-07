from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Date

from app.core.database import Base


class Semestre(Base):

    __tablename__ = "semestres"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    nome = Column(
        String,
        nullable=False
    )

    data_inicio = Column(
        Date,
        nullable=False
    )

    data_fim = Column(
        Date,
        nullable=False
    )

    status = Column(
        String,
        nullable=False
    )