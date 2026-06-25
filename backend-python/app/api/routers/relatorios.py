from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.relatorio import RelatorioResponse
from app.models import Curso, Semestre, Turma, OfertaDisciplina, Alocacao
from app.api.routers.auth import verificar_admin_ou_coordenador

router = APIRouter(prefix="/api/relatorios", tags=["Módulo de Relatórios"])

@router.get("/curso/{curso_id}/semestre/{semestre_id}", response_model=RelatorioResponse, dependencies=[Depends(verificar_admin_ou_coordenador)])
def emitir_relatorio(curso_id: int, semestre_id: int, db: Session = Depends(get_db)):
    
    # 1. Buscar as entidades principais
    curso = db.query(Curso).filter(Curso.id == curso_id).first()
    semestre = db.query(Semestre).filter(Semestre.id == semestre_id).first()
    
    if not curso or not semestre:
        raise HTTPException(status_code=404, detail="Curso ou Semestre não encontrado.")

    # 2. Buscar turmas daquele curso naquele semestre
    turmas_db = db.query(Turma).filter(
        Turma.curso_id == curso_id,
        Turma.semestre_id == semestre_id
    ).all()

    # Conjuntos para garantir que não vamos contar a mesma disciplina ou professor duas vezes
    set_disciplinas = set()
    set_professores = set() 
    carga_total = 0
    
    lista_turmas_response = []

    # 3. Iterar sobre cada turma
    for turma in turmas_db:
        grade_turma = []
        
        # Buscar as OFERTAS vinculadas a essa turma
        ofertas = db.query(OfertaDisciplina).filter(OfertaDisciplina.turma_id == turma.id).all()
        
        for oferta in ofertas:
            # Alimentar o Resumo (Métricas)
            if oferta.disciplina_id:
                set_disciplinas.add(oferta.disciplina_id)
            if oferta.professor_id:
                set_professores.add(oferta.professor_id)
            
            # Soma a carga horária (se for None, assume 0)
            carga_total += (oferta.carga_horaria or 0)

            # Buscar as ALOCAÇÕES (Horários) dessa oferta específica
            alocacoes = db.query(Alocacao).filter(Alocacao.oferta_id == oferta.id).all()
            
            for aloc in alocacoes:
                # Monta a aula para a grade
                # Nota: Ajuste 'dia_semana' e 'hora_inicio' caso os nomes na sua tabela de Horario sejam diferentes!
                grade_turma.append({
                    "dia": getattr(aloc.horario, "dia_semana", "Não definido"), 
                    "horario": getattr(aloc.horario, "hora_inicio", "Não definido"),
                    "disciplina": oferta.disciplina.nome if oferta.disciplina else "Sem Disciplina", 
                    "professor": oferta.professor.nome if oferta.professor else "Sem Professor"
                })
                
        # Adiciona a turma completa na resposta
        lista_turmas_response.append({
            "nome": turma.nome,
            "grade": grade_turma
        })

    # 4. Retorno formatado perfeitamente para o Schema
    return {
        "curso": curso.nome,
        # Ajuste 'semestre_numero' e 'ano' de acordo com as propriedades do seu modelo Semestre
        "semestre": semestre.nome, 
        "resumo": {
            "turmas": len(turmas_db),
            "disciplinas": len(set_disciplinas),
            "professores": len(set_professores),
            "carga_total": carga_total
        },
        "turmas": lista_turmas_response,
        "alertas": []
    }