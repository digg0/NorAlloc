from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.core.database import get_db
from app.models.alocacao import Alocacao
from app.models.oferta_disciplina import OfertaDisciplina
from app.models.horario import Horario
from app.schemas.alocacao import AlocacaoCreate, AlocacaoUpdate, AlocacaoResponse, GerarGradeResponse
from app.api.routers.auth import obter_usuario_atual, verificar_admin_ou_coordenador

router = APIRouter(prefix="/alocacoes", tags=["Alocações"])


@router.get("/", response_model=List[AlocacaoResponse], dependencies=[Depends(obter_usuario_atual)])
def listar_alocacoes(db: Session = Depends(get_db)):
    return db.query(Alocacao).order_by(Alocacao.id).all()


@router.get("/{alocacao_id}", response_model=AlocacaoResponse, dependencies=[Depends(obter_usuario_atual)])
def buscar_alocacao(alocacao_id: int, db: Session = Depends(get_db)):
    aloc = db.query(Alocacao).filter(Alocacao.id == alocacao_id).first()
    if not aloc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alocação não encontrada.")
    return aloc


@router.post("/", response_model=AlocacaoResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(verificar_admin_ou_coordenador)])
def criar_alocacao(dados: AlocacaoCreate, db: Session = Depends(get_db)):
    if not db.query(OfertaDisciplina).filter(OfertaDisciplina.id == dados.oferta_id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Oferta não encontrada.")
    if not db.query(Horario).filter(Horario.id == dados.horario_id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Horário não encontrado.")

    nova = Alocacao(oferta_id=dados.oferta_id, horario_id=dados.horario_id)
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return nova


@router.put("/{alocacao_id}", response_model=AlocacaoResponse, dependencies=[Depends(verificar_admin_ou_coordenador)])
def atualizar_alocacao(alocacao_id: int, dados: AlocacaoUpdate, db: Session = Depends(get_db)):
    aloc = db.query(Alocacao).filter(Alocacao.id == alocacao_id).first()
    if not aloc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alocação não encontrada.")
    if not db.query(Horario).filter(Horario.id == dados.horario_id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Horário não encontrado.")

    aloc.horario_id = dados.horario_id
    db.commit()
    db.refresh(aloc)
    return aloc


@router.delete("/{alocacao_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(verificar_admin_ou_coordenador)])
def remover_alocacao(alocacao_id: int, db: Session = Depends(get_db)):
    aloc = db.query(Alocacao).filter(Alocacao.id == alocacao_id).first()
    if not aloc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alocação não encontrada.")
    db.delete(aloc)
    db.commit()
    return None


@router.post("/gerar-grade", response_model=GerarGradeResponse, dependencies=[Depends(verificar_admin_ou_coordenador)])
def gerar_grade(semestre_id: int, db: Session = Depends(get_db)):
    return GerarGradeResponse(
        sucesso=False,
        mensagem="Solver Z3 ainda não implementado. Use a alocação manual por enquanto.",
        total_alocacoes=0,
    )
