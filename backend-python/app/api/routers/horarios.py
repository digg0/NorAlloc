from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.horario import Horario
from app.models.disponibilidade_turma import DisponibilidadeTurma
from app.schemas.horario import HorarioCreate, HorarioUpdate, HorarioResponse

router = APIRouter(prefix="/api/horarios", tags=["Módulo de Cadastros Base - Horários"])


def verificar_admin():
    pass  # Permite testar os endpoints agora


@router.get(
    "",
    response_model=List[HorarioResponse],
    dependencies=[Depends(verificar_admin)],
)
def listar_horarios(
    turno: Optional[str] = None,
    dia_semana: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Lista todos os horários cadastrados. Aceita filtro opcional por turno e dia_semana."""
    query = db.query(Horario)
    if turno:
        query = query.filter(Horario.turno == turno.strip().upper())
    if dia_semana:
        query = query.filter(Horario.dia_semana == dia_semana.strip().upper())
    return query.order_by(Horario.dia_semana, Horario.turno, Horario.hora_inicio).all()


@router.get(
    "/{horario_id}",
    response_model=HorarioResponse,
    dependencies=[Depends(verificar_admin)],
)
def obter_horario(horario_id: int, db: Session = Depends(get_db)):
    """Retorna um horário pelo ID."""
    horario = db.query(Horario).filter(Horario.id == horario_id).first()
    if not horario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Horário não encontrado."
        )
    return horario


@router.post(
    "",
    response_model=HorarioResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verificar_admin)],
)
def criar_horario(dados: HorarioCreate, db: Session = Depends(get_db)):
    """Cadastra um novo slot de horário."""
    existente = (
        db.query(Horario)
        .filter(
            Horario.dia_semana == dados.dia_semana,
            Horario.turno == dados.turno,
            Horario.hora_inicio == dados.hora_inicio,
            Horario.hora_fim == dados.hora_fim,
        )
        .first()
    )
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um horário com este dia, turno, hora de início e hora de fim.",
        )

    novo = Horario(
        dia_semana=dados.dia_semana,
        turno=dados.turno,
        hora_inicio=dados.hora_inicio,
        hora_fim=dados.hora_fim,
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo


@router.put(
    "/{horario_id}",
    response_model=HorarioResponse,
    dependencies=[Depends(verificar_admin)],
)
def atualizar_horario(
    horario_id: int, dados: HorarioUpdate, db: Session = Depends(get_db)
):
    """Atualiza um ou mais campos de um horário existente."""
    horario = db.query(Horario).filter(Horario.id == horario_id).first()
    if not horario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Horário não encontrado."
        )

    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(horario, campo, valor)

    if horario.hora_fim <= horario.hora_inicio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="hora_fim deve ser posterior a hora_inicio.",
        )

    db.commit()
    db.refresh(horario)
    return horario


@router.delete(
    "/{horario_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(verificar_admin)],
)
def remover_horario(horario_id: int, db: Session = Depends(get_db)):
    """Remove um horário. Retorna 409 se houver turmas vinculadas."""
    horario = db.query(Horario).filter(Horario.id == horario_id).first()
    if not horario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Horário não encontrado."
        )

    vinculado = (
        db.query(DisponibilidadeTurma)
        .filter(DisponibilidadeTurma.horario_id == horario_id)
        .first()
    )
    if vinculado:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Não é possível remover este horário pois há turmas vinculadas a ele.",
        )

    db.delete(horario)
    db.commit()
    return None
