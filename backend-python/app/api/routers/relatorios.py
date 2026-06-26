import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import obter_curso_id_coordenador, obter_usuario_atual
from app.models import Alocacao, Coordenador, Curso, OfertaDisciplina, Semestre, Turma
from app.models.usuario import Usuario
from app.schemas.relatorio import RelatorioResponse
from app.services import validacao_service

router = APIRouter(prefix="/api/relatorios", tags=["Módulo de Relatórios"])


def _exigir_acesso_ao_curso(curso_id: int, usuario: Usuario, db: Session) -> None:
    curso_id_coordenador = obter_curso_id_coordenador(usuario, db)
    if curso_id_coordenador is not None and curso_id_coordenador != curso_id:
        raise HTTPException(status_code=403, detail="Este relatório não pertence ao seu curso.")


def _montar_relatorio(curso_id: int, semestre_id: int, db: Session) -> dict:
    curso = db.query(Curso).filter(Curso.id == curso_id).first()
    semestre = db.query(Semestre).filter(Semestre.id == semestre_id).first()

    if not curso or not semestre:
        raise HTTPException(status_code=404, detail="Curso ou Semestre não encontrado.")

    coordenador = (
        db.query(Coordenador)
        .filter(Coordenador.curso_id == curso_id, Coordenador.ativo.is_(True))
        .first()
    )

    turmas_db = (
        db.query(Turma).filter(Turma.curso_id == curso_id, Turma.semestre_id == semestre_id).all()
    )

    set_disciplinas = set()
    set_professores = set()
    carga_total = 0

    lista_turmas_response = []

    for turma in turmas_db:
        grade_turma = []
        ofertas = db.query(OfertaDisciplina).filter(OfertaDisciplina.turma_id == turma.id).all()

        for oferta in ofertas:
            if oferta.disciplina:
                set_disciplinas.add(oferta.disciplina.nome)
            if oferta.professor:
                set_professores.add(oferta.professor.nome)

            carga_total += oferta.carga_horaria or 0

            alocacoes = db.query(Alocacao).filter(Alocacao.oferta_id == oferta.id).all()
            for alocacao in alocacoes:
                grade_turma.append(
                    {
                        "dia": alocacao.horario.dia_semana,
                        "horario": alocacao.horario.hora_inicio.strftime("%H:%M"),
                        "disciplina": oferta.disciplina.nome if oferta.disciplina else "Sem Disciplina",
                        "professor": oferta.professor.nome if oferta.professor else "Sem Professor",
                    }
                )

        lista_turmas_response.append({"nome": turma.nome, "grade": grade_turma})

    alertas_do_curso = validacao_service.validar_semestre(semestre_id, db, curso_id=curso_id)

    return {
        "curso": curso.nome,
        "semestre": semestre.nome,
        "coordenador": coordenador.nome if coordenador else None,
        "resumo": {
            "turmas": len(turmas_db),
            "disciplinas": len(set_disciplinas),
            "professores": len(set_professores),
            "carga_total": carga_total,
        },
        "turmas": lista_turmas_response,
        "professores_envolvidos": sorted(set_professores),
        "disciplinas_ofertadas": sorted(set_disciplinas),
        "alertas": alertas_do_curso,
    }


@router.get("/curso/{curso_id}/semestre/{semestre_id}", response_model=RelatorioResponse)
def emitir_relatorio(
    curso_id: int,
    semestre_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    _exigir_acesso_ao_curso(curso_id, usuario, db)
    return _montar_relatorio(curso_id, semestre_id, db)


@router.get("/curso/{curso_id}/semestre/{semestre_id}/pdf")
def emitir_relatorio_pdf(
    curso_id: int,
    semestre_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    _exigir_acesso_ao_curso(curso_id, usuario, db)
    dados = _montar_relatorio(curso_id, semestre_id, db)

    buffer = io.BytesIO()
    documento = SimpleDocTemplate(buffer, pagesize=A4)
    estilos = getSampleStyleSheet()
    elementos = []

    elementos.append(Paragraph(f"Grade Consolidada — {dados['curso']} / {dados['semestre']}", estilos["Title"]))
    if dados["coordenador"]:
        elementos.append(Paragraph(f"Coordenador: {dados['coordenador']}", estilos["Normal"]))
    elementos.append(Spacer(1, 12))

    resumo = dados["resumo"]
    tabela_resumo = Table(
        [
            ["Turmas", "Disciplinas", "Professores", "Carga Total (h)"],
            [resumo["turmas"], resumo["disciplinas"], resumo["professores"], resumo["carga_total"]],
        ]
    )
    tabela_resumo.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ]
        )
    )
    elementos.append(tabela_resumo)
    elementos.append(Spacer(1, 16))

    for turma in dados["turmas"]:
        elementos.append(Paragraph(f"Turma {turma['nome']}", estilos["Heading2"]))
        linhas = [["Dia", "Horário", "Disciplina", "Professor"]] + [
            [a["dia"], a["horario"], a["disciplina"], a["professor"]] for a in turma["grade"]
        ]
        if len(linhas) == 1:
            linhas.append(["—", "—", "Sem alocações", "—"])
        tabela_turma = Table(linhas)
        tabela_turma.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#374151")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                ]
            )
        )
        elementos.append(tabela_turma)
        elementos.append(Spacer(1, 12))

    if dados["alertas"]:
        elementos.append(Paragraph("Alertas", estilos["Heading2"]))
        for alerta in dados["alertas"]:
            elementos.append(Paragraph(f"[{alerta['tipo']}] {alerta['descricao']}", estilos["Normal"]))
    else:
        elementos.append(Paragraph("Nenhum alerta encontrado.", estilos["Normal"]))

    documento.build(elementos)
    buffer.seek(0)

    nome_arquivo = f"relatorio_curso_{curso_id}_semestre_{semestre_id}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{nome_arquivo}"'},
    )
