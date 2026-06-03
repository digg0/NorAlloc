from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.disponibilidade import Restricao
from app.schemas.disponibilidade import (
    RestricaoCreate,
    RestricaoResponse,
    validar_e_normalizar_horarios,
)

router = APIRouter(prefix="/api", tags=["Módulo de Restrições e Preferências"])

# ---------------------------------------------------------
# MOCK DA AUTENTICAÇÃO (A substituir pelo JWT futuramente)
#
# Nesta fase os PROFESSORES terão login e informam a própria disponibilidade.
# Quando o JWT existir, esta dependência deve:
#   - validar o token (401 se ausente/inválido);
#   - no POST/GET de /professores/{professor_id}/preferencias, permitir que um
#     PROFESSOR só acesse o PRÓPRIO professor_id (token.sub == professor_id),
#     enquanto ADMIN/COORDENADOR podem acessar qualquer um (403 caso contrário);
#   - em /semestres/.../restricoes e /restricoes/{id}, restringir a ADMIN/COORD.
def obter_usuario_atual():
    pass  # Permite testar os endpoints agora
# ---------------------------------------------------------


@router.post(
    "/professores/{professor_id}/preferencias",
    response_model=RestricaoResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(obter_usuario_atual)],
)
def salvar_preferencias(
    professor_id: int,
    dados: RestricaoCreate,
    response: Response,
    db: Session = Depends(get_db),
):
    """Salva (cria ou atualiza) a disponibilidade do docente no semestre.

    Retorna 201 quando cria e 200 quando atualiza uma restrição já existente
    (chave professor_id + semestre_id).
    """
    
    try:
        horarios = validar_e_normalizar_horarios(dados.horarios_bloqueados)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        )

    existente = (
        db.query(Restricao)
        .filter(
            Restricao.professor_id == professor_id,
            Restricao.semestre_id == dados.semestre_id,
        )
        .first()
    )

    if existente:
        existente.horarios_bloqueados = horarios
        existente.limite_carga_horaria = dados.limite_carga_horaria
        db.commit()
        db.refresh(existente)
        response.status_code = status.HTTP_200_OK
        return existente

    nova = Restricao(
        professor_id=professor_id,
        semestre_id=dados.semestre_id,
        horarios_bloqueados=horarios,
        limite_carga_horaria=dados.limite_carga_horaria,
    )
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return nova


@router.get(
    "/professores/{professor_id}/preferencias",
    response_model=RestricaoResponse,
    dependencies=[Depends(obter_usuario_atual)],
)
def consultar_preferencias(
    professor_id: int,
    semestre_id: int,  
    db: Session = Depends(get_db),
):
    """Retorna as preferências/janelas salvas do docente no semestre."""
    restricao = (
        db.query(Restricao)
        .filter(
            Restricao.professor_id == professor_id,
            Restricao.semestre_id == semestre_id,
        )
        .first()
    )
    if not restricao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nenhuma preferência cadastrada para este professor neste semestre.",
        )
    return restricao


@router.get(
    "/semestres/{semestre_id}/restricoes",
    response_model=List[RestricaoResponse],
    dependencies=[Depends(obter_usuario_atual)],
)
def listar_restricoes_do_semestre(semestre_id: int, db: Session = Depends(get_db)):
    """Lista todas as restrições do semestre (uma por professor)."""
    return (
        db.query(Restricao)
        .filter(Restricao.semestre_id == semestre_id)
        .order_by(Restricao.professor_id)
        .all()
    )


@router.delete(
    "/restricoes/{restricao_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(obter_usuario_atual)],
)
def remover_restricao(restricao_id: int, db: Session = Depends(get_db)):
    """Remove uma restrição específica."""
    restricao = db.query(Restricao).filter(Restricao.id == restricao_id).first()
    if not restricao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Restrição não encontrada."
        )
    db.delete(restricao)
    db.commit()
    return None