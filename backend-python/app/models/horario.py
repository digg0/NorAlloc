from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Time

from app.core.database import Base


class Horario(Base):

    __tablename__ = "horarios"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    turno = Column(
        String,
        nullable=False
    )

    hora_inicio = Column(
        Time,
        nullable=False
    )

    hora_fim = Column(
        Time,
        nullable=False
    )