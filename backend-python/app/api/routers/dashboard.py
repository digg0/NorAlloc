from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.routers.auth import obter_usuario_atual
from app.models.usuario import Usuario
from app.models.professor import Professor
from app.models.disciplina import Disciplina
from app.models.curso import Curso
from app.models.turma import Turma
from app.models.coordenador import Coordenador
from app.models.semestre import Semestre
from app.models.oferta_disciplina import OfertaDisciplina
from app.models.preferencias_professor import PreferenciaProfessor
from app.schemas.dashboard import (
    ResumoGeralResponse,
    ResumoProfessorResponse,
    ProfessoresResumo,
    SemestreResumo,
)
from app.services import validacao_service

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

_CONCLUIDOS = {"CONCLUIDO", "CONCLUÍDO", "FINALIZADO", "ENCERRADO"}


def _semestre_atual(semestres):
    """Considera 'atual' o semestre não concluído mais recente; se todos
    estiverem concluídos (ou não houver status), pega o mais recente."""
    if not semestres:
        return None
    nao_concluidos = [
        s for s in semestres if (s.status or "").strip().upper() not in _CONCLUIDOS
    ]
    candidatos = nao_concluidos or semestres
    return max(candidatos, key=lambda s: s.data_inicio)


@router.get("/geral", response_model=ResumoGeralResponse)
def resumo_geral(db: Session = Depends(get_db)):
    """Contagens gerais para o dashboard de admin/coordenador."""
    professores = db.query(Professor).all()
    regimes = Counter((p.regime_trabalho or "").strip().upper() for p in professores)
    semestres = db.query(Semestre).order_by(Semestre.data_inicio.desc()).all()
    atual = _semestre_atual(semestres)

    conflitos = 0
    if atual:
        try:
            alertas = validacao_service.validar_semestre(atual.id, db)
            conflitos = sum(
                1 for a in alertas
                if a.tipo in ("CONFLITO_PROFESSOR", "CONFLITO_TURMA")
            )
        except Exception:
            pass

    return ResumoGeralResponse(
        professores=ProfessoresResumo(
            total=len(professores),
            de=regimes.get("DE", 0),
            h40=regimes.get("40H", 0),
            h20=regimes.get("20H", 0),
        ),
        disciplinas=db.query(Disciplina).count(),
        cursos=db.query(Curso).count(),
        turmas=db.query(Turma).count(),
        coordenadores=db.query(Coordenador).filter(Coordenador.ativo == True).count(),
        ofertas=db.query(OfertaDisciplina).count(),
        semestres=[SemestreResumo.model_validate(s) for s in semestres],
        semestre_atual=SemestreResumo.model_validate(atual) if atual else None,
        conflitos=conflitos,
    )


@router.get("/professor", response_model=ResumoProfessorResponse)
def resumo_professor(
    usuario: Usuario = Depends(obter_usuario_atual),
    db: Session = Depends(get_db),
):
    """Dados do professor autenticado (identificado pelo e-mail do token)."""
    prof = db.query(Professor).filter(Professor.email == usuario.email).first()
    if not prof:
        return ResumoProfessorResponse(tem_cadastro=False, nome=usuario.nome)

    n_ofertas = (
        db.query(OfertaDisciplina)
        .filter(OfertaDisciplina.professor_id == prof.id)
        .count()
    )
    n_pref = (
        db.query(PreferenciaProfessor)
        .filter(PreferenciaProfessor.professor_id == prof.id)
        .count()
    )

    return ResumoProfessorResponse(
        tem_cadastro=True,
        nome=prof.nome,
        regime_trabalho=prof.regime_trabalho,
        carga_maxima=prof.carga_maxima,
        disciplinas_atribuidas=n_ofertas,
        preferencias=n_pref,
    )
