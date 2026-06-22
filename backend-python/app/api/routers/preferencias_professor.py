from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.preferencias_professor import PreferenciaProfessor
from app.models.professor import Professor
from app.schemas.professor import (
    PreferenciaProfessorCreate,
    PreferenciaProfessorUpdate,
    PreferenciaProfessorResponse
)

router = APIRouter(
    prefix="/api/professores",
    tags=["Módulo de Preferências dos Professores"]
)

# ---------------------------------------------------------
# MOCK DA AUTENTICAÇÃO (A substituir pelo JWT futuramente)
def verificar_admin():
    pass # Permite testar os endpoints agora
# ---------------------------------------------------------


@router.post(
    "/{professor_id}/preferencias",
    response_model=PreferenciaProfessorResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verificar_admin)]
)
def criar_preferencia_professor(
    professor_id: int,
    pref_in: PreferenciaProfessorCreate,
    db: Session = Depends(get_db)
):
    """Cria as preferências de um professor para alocação de horários.

    Permite definir preferências como:
    - Aulas duplas/geminadas
    - Evitar janelas entre aulas
    - Evitar sexta-feira
    - Preferência por manhã
    - Máximo e mínimo de aulas por dia
    """

    # Verifica se o professor existe
    db_professor = db.query(Professor).filter(Professor.id == professor_id).first()
    if not db_professor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professor não encontrado."
        )

    # Verifica se já existe uma preferência para este professor
    db_pref = db.query(PreferenciaProfessor).filter(
        PreferenciaProfessor.professor_id == professor_id
    ).first()

    if db_pref:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este professor já possui preferências registradas. Use PUT para atualizar."
        )

    # Validação: se min_aulas_dia e max_aulas_dia foram fornecidos, min <= max
    if (pref_in.min_aulas_dia and pref_in.max_aulas_dia and
        pref_in.min_aulas_dia > pref_in.max_aulas_dia):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mínimo de aulas não pode ser maior que o máximo."
        )

    nova_preferencia = PreferenciaProfessor(
        professor_id=professor_id,
        prefere_aula_dupla=pref_in.prefere_aula_dupla,
        evitar_janelas=pref_in.evitar_janelas,
        evitar_sexta=pref_in.evitar_sexta,
        prefere_manha=pref_in.prefere_manha,
        max_aulas_dia=pref_in.max_aulas_dia,
        min_aulas_dia=pref_in.min_aulas_dia
    )

    db.add(nova_preferencia)
    db.commit()
    db.refresh(nova_preferencia)
    return nova_preferencia


@router.get(
    "/{professor_id}/preferencias",
    response_model=PreferenciaProfessorResponse,
    dependencies=[Depends(verificar_admin)]
)
def obter_preferencias_professor(
    professor_id: int,
    db: Session = Depends(get_db)
):
    """Obtém as preferências registradas de um professor."""

    # Verifica se o professor existe
    db_professor = db.query(Professor).filter(Professor.id == professor_id).first()
    if not db_professor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professor não encontrado."
        )

    db_pref = db.query(PreferenciaProfessor).filter(
        PreferenciaProfessor.professor_id == professor_id
    ).first()

    if not db_pref:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferências não encontradas para este professor."
        )

    return db_pref


@router.put(
    "/{professor_id}/preferencias",
    response_model=PreferenciaProfessorResponse,
    dependencies=[Depends(verificar_admin)]
)
def atualizar_preferencias_professor(
    professor_id: int,
    pref_in: PreferenciaProfessorUpdate,
    db: Session = Depends(get_db)
):
    """Atualiza as preferências de um professor.

    Apenas os campos fornecidos serão atualizados (atualização parcial).
    """

    db_pref = db.query(PreferenciaProfessor).filter(
        PreferenciaProfessor.professor_id == professor_id
    ).first()

    if not db_pref:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferências não encontradas para este professor."
        )

    # Atualiza apenas os campos fornecidos
    update_data = pref_in.model_dump(exclude_unset=True)

    # Validação: se ambos foram fornecidos, min <= max
    if "min_aulas_dia" in update_data and "max_aulas_dia" in update_data:
        if (update_data["min_aulas_dia"] and update_data["max_aulas_dia"] and
            update_data["min_aulas_dia"] > update_data["max_aulas_dia"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mínimo de aulas não pode ser maior que o máximo."
            )

    # Se apenas min foi fornecido, comparar com max atual
    if "min_aulas_dia" in update_data and "max_aulas_dia" not in update_data:
        if update_data["min_aulas_dia"] and db_pref.max_aulas_dia:
            if update_data["min_aulas_dia"] > db_pref.max_aulas_dia:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Mínimo de aulas não pode ser maior que o máximo."
                )

    # Se apenas max foi fornecido, comparar com min atual
    if "max_aulas_dia" in update_data and "min_aulas_dia" not in update_data:
        if update_data["max_aulas_dia"] and db_pref.min_aulas_dia:
            if db_pref.min_aulas_dia > update_data["max_aulas_dia"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Máximo de aulas não pode ser menor que o mínimo."
                )

    for campo, valor in update_data.items():
        setattr(db_pref, campo, valor)

    db.commit()
    db.refresh(db_pref)
    return db_pref


@router.delete(
    "/{professor_id}/preferencias",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(verificar_admin)]
)
def deletar_preferencias_professor(
    professor_id: int,
    db: Session = Depends(get_db)
):
    """Remove as preferências registradas de um professor."""

    db_pref = db.query(PreferenciaProfessor).filter(
        PreferenciaProfessor.professor_id == professor_id
    ).first()

    if not db_pref:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferências não encontradas para este professor."
        )

    db.delete(db_pref)
    db.commit()


@router.get(
    "/preferencias",
    response_model=List[PreferenciaProfessorResponse],
    dependencies=[Depends(verificar_admin)]
)
def listar_todas_preferencias(db: Session = Depends(get_db)):
    """Lista as preferências de todos os professores."""

    return db.query(PreferenciaProfessor).all()


@router.get(
    "/preferencias/{preferencia_id}",
    response_model=PreferenciaProfessorResponse,
    dependencies=[Depends(verificar_admin)]
)
def obter_preferencia_por_id(
    preferencia_id: int,
    db: Session = Depends(get_db)
):
    """Obtém uma preferência específica pelo seu ID."""

    db_pref = db.query(PreferenciaProfessor).filter(
        PreferenciaProfessor.id == preferencia_id
    ).first()

    if not db_pref:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferência não encontrada."
        )

    return db_pref
