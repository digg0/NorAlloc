import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import obter_curso_id_coordenador, obter_usuario_atual
from app.models import Alocacao, Coordenador, Curso, OfertaDisciplina, Semestre, Turma
from app.models.usuario import Usuario
from app.schemas.relatorio import RelatorioResponse
from app.services import validacao_service

router = APIRouter(prefix="/api/relatorios", tags=["Módulo de Relatórios"])

_DIAS_ORDEM: dict[str, int] = {
    'SEGUNDA': 0, 'TERCA': 1, 'QUARTA': 2, 'QUINTA': 3, 'SEXTA': 4, 'SABADO': 5,
}
_DIA_LABEL_PT: dict[str, str] = {
    'SEGUNDA': 'Segunda-feira',
    'TERCA':   'Terça-feira',
    'QUARTA':  'Quarta-feira',
    'QUINTA':  'Quinta-feira',
    'SEXTA':   'Sexta-feira',
    'SABADO':  'Sábado',
}

# ── PDF: grade visual ─────────────────────────────────────────────────────────
_DIAS_UTEIS = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA']
_DIA_LABEL_CURTO = {
    'SEGUNDA': 'Segunda', 'TERCA': 'Terça', 'QUARTA': 'Quarta',
    'QUINTA': 'Quinta', 'SEXTA': 'Sexta',
}
_LABEL_TO_DIA: dict[str, str] = {
    'Segunda-feira': 'SEGUNDA', 'Terça-feira': 'TERCA',
    'Quarta-feira':  'QUARTA',  'Quinta-feira': 'QUINTA',
    'Sexta-feira':   'SEXTA',   'Sábado': 'SABADO',
}

# Paleta idêntica ao frontend (bg, fg por índice)
_BG_PALETTE = [
    colors.HexColor('#BFDBFE'), colors.HexColor('#A7F3D0'), colors.HexColor('#FDE68A'),
    colors.HexColor('#FECACA'), colors.HexColor('#DDD6FE'), colors.HexColor('#FED7AA'),
    colors.HexColor('#99F6E4'), colors.HexColor('#FBCFE8'), colors.HexColor('#D9F99D'),
    colors.HexColor('#A5F3FC'),
]
_FG_PALETTE = [
    colors.HexColor('#1E3A5F'), colors.HexColor('#064E3B'), colors.HexColor('#78350F'),
    colors.HexColor('#7F1D1D'), colors.HexColor('#3B0764'), colors.HexColor('#7C2D12'),
    colors.HexColor('#134E4A'), colors.HexColor('#831843'), colors.HexColor('#365314'),
    colors.HexColor('#164E63'),
]

def _disc_hash(nome: str) -> int:
    h = 5381
    for c in nome:
        h = ((h * 31) + ord(c)) & 0xFFFFFFFF
    return h

def _disc_bg(nome: str):  return _BG_PALETTE[_disc_hash(nome) % len(_BG_PALETTE)]
def _disc_fg(nome: str):  return _FG_PALETTE[_disc_hash(nome) % len(_FG_PALETTE)]


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
                dia_raw = alocacao.horario.dia_semana
                grade_turma.append(
                    {
                        "_dia_raw": dia_raw,
                        "dia": _DIA_LABEL_PT.get(dia_raw, dia_raw),
                        "horario": alocacao.horario.hora_inicio.strftime("%H:%M"),
                        "disciplina": oferta.disciplina.nome if oferta.disciplina else "Sem Disciplina",
                        "professor": oferta.professor.nome if oferta.professor else "Sem Professor",
                    }
                )

        grade_turma.sort(key=lambda x: (_DIAS_ORDEM.get(x["_dia_raw"], 99), x["horario"]))
        for item in grade_turma:
            item.pop("_dia_raw")
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
    PAGE = landscape(A4)          # 841 × 595 pt
    MARGIN = 28
    USABLE_W = PAGE[0] - MARGIN * 2   # ≈ 785 pt
    HORA_COL  = 58
    DAY_COL   = (USABLE_W - HORA_COL) / 5   # ≈ 145 pt each

    documento = SimpleDocTemplate(
        buffer, pagesize=PAGE,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN, bottomMargin=MARGIN,
    )
    estilos = getSampleStyleSheet()

    # Estilos customizados
    st_header_cell = ParagraphStyle(
        'hdr', parent=estilos['Normal'],
        fontSize=8, leading=10, alignment=TA_CENTER,
        textColor=colors.white, fontName='Helvetica-Bold',
    )
    st_hora = ParagraphStyle(
        'hora', parent=estilos['Normal'],
        fontSize=8, leading=10, alignment=TA_CENTER,
        textColor=colors.HexColor('#6B7280'), fontName='Helvetica-Bold',
    )
    st_disc = ParagraphStyle(
        'disc', parent=estilos['Normal'],
        fontSize=8, leading=10,
    )
    st_vazio = ParagraphStyle(
        'vazio', parent=estilos['Normal'], fontSize=7,
    )

    elementos = []

    # ── Cabeçalho do documento ────────────────────────────────────────────────
    elementos.append(Paragraph(
        f"<b>Grade Horária — {dados['curso']}</b>",
        ParagraphStyle('tit', parent=estilos['Normal'], fontSize=13, leading=16,
                       textColor=colors.HexColor('#1B4332'), fontName='Helvetica-Bold')
    ))
    elementos.append(Paragraph(
        f"Semestre: {dados['semestre']}" +
        (f"  ·  Coordenador(a): {dados['coordenador']}" if dados['coordenador'] else ''),
        ParagraphStyle('sub', parent=estilos['Normal'], fontSize=9, leading=12,
                       textColor=colors.HexColor('#6B7280'))
    ))
    elementos.append(Spacer(1, 14))

    # ── Grade por turma ───────────────────────────────────────────────────────
    VERDE = colors.HexColor('#1B4332')
    CINZA_BG = colors.HexColor('#F3F4F6')
    CINZA_BORDA = colors.HexColor('#E5E7EB')

    primeiro = True
    for turma in dados['turmas']:
        if not primeiro:
            elementos.append(PageBreak())
        primeiro = False

        # Título da turma
        elementos.append(Paragraph(
            turma['nome'],
            ParagraphStyle('tnome', parent=estilos['Normal'], fontSize=11, leading=14,
                           textColor=VERDE, fontName='Helvetica-Bold')
        ))
        elementos.append(Spacer(1, 6))

        if not turma['grade']:
            elementos.append(Paragraph('Sem alocações nesta turma.', estilos['Normal']))
            elementos.append(Spacer(1, 12))
            continue

        # Monta mapa (dia_key, horario) → aula
        por_celula: dict[tuple[str, str], dict] = {}
        for aula in turma['grade']:
            dia_key = _LABEL_TO_DIA.get(aula['dia'], aula['dia'].upper())
            por_celula[(dia_key, aula['horario'])] = aula

        # Horários usados por esta turma, em ordem cronológica
        horas_usadas = sorted({a['horario'] for a in turma['grade']})

        # Linha de cabeçalho
        header_row = [Paragraph('Horário', st_header_cell)] + [
            Paragraph(_DIA_LABEL_CURTO.get(d, d), st_header_cell) for d in _DIAS_UTEIS
        ]
        table_data = [header_row]
        style_cmds: list[tuple] = [
            # Cabeçalho verde
            ('BACKGROUND', (0, 0), (-1, 0), VERDE),
            ('TEXTCOLOR',  (0, 0), (-1, 0), colors.white),
            # Coluna de horário cinza
            ('BACKGROUND', (0, 1), (0, -1), CINZA_BG),
            # Grid e padding uniformes
            ('GRID',         (0, 0), (-1, -1), 0.4, CINZA_BORDA),
            ('VALIGN',       (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING',   (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING',(0, 0), (-1, -1), 5),
            ('LEFTPADDING',  (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            # Linha 0 mais alta
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#FAFAFA')]),
        ]

        for row_idx, hora in enumerate(horas_usadas, start=1):
            row = [Paragraph(hora, st_hora)]
            for col_idx, dia in enumerate(_DIAS_UTEIS, start=1):
                aula = por_celula.get((dia, hora))
                if aula:
                    disc_nome = aula['disciplina']
                    prof_nome = aula['professor']
                    bg = _disc_bg(disc_nome)
                    fg = _disc_fg(disc_nome)
                    cell_style = ParagraphStyle(
                        f'c{row_idx}{col_idx}', parent=st_disc,
                        textColor=fg, fontName='Helvetica-Bold',
                    )
                    prof_style = ParagraphStyle(
                        f'p{row_idx}{col_idx}', parent=st_disc,
                        textColor=fg, fontSize=7, fontName='Helvetica',
                    )
                    row.append([
                        Paragraph(disc_nome, cell_style),
                        Paragraph(f'({prof_nome})', prof_style),
                    ])
                    style_cmds.append(('BACKGROUND', (col_idx, row_idx), (col_idx, row_idx), bg))
                else:
                    row.append(Paragraph('', st_vazio))
            table_data.append(row)

        tabela = Table(
            table_data,
            colWidths=[HORA_COL] + [DAY_COL] * 5,
            repeatRows=1,
        )
        tabela.setStyle(TableStyle(style_cmds))
        elementos.append(KeepTogether([tabela]))
        elementos.append(Spacer(1, 10))

        # Legenda de disciplinas desta turma
        discs_unicas = sorted({a['disciplina'] for a in turma['grade']})
        if discs_unicas:
            legenda_rows = [['Disciplina', 'Professor']] + [
                [d, next((a['professor'] for a in turma['grade'] if a['disciplina'] == d), '—')]
                for d in discs_unicas
            ]
            leg_style: list[tuple] = [
                ('BACKGROUND', (0, 0), (-1, 0), CINZA_BG),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 7),
                ('GRID', (0, 0), (-1, -1), 0.3, CINZA_BORDA),
                ('TOPPADDING',    (0, 0), (-1, -1), 3),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                ('LEFTPADDING',   (0, 0), (-1, -1), 5),
                ('RIGHTPADDING',  (0, 0), (-1, -1), 5),
            ]
            for i, d in enumerate(discs_unicas, start=1):
                leg_style.append(('BACKGROUND', (0, i), (0, i), _disc_bg(d)))
                leg_style.append(('TEXTCOLOR',  (0, i), (0, i), _disc_fg(d)))
                leg_style.append(('FONTNAME',   (0, i), (0, i), 'Helvetica-Bold'))
            tabela_legenda = Table(legenda_rows, colWidths=[USABLE_W * 0.55, USABLE_W * 0.45])
            tabela_legenda.setStyle(TableStyle(leg_style))
            elementos.append(tabela_legenda)

        elementos.append(Spacer(1, 6))

    documento.build(elementos)
    buffer.seek(0)

    nome_arquivo = f"grade_{dados['curso'].replace(' ', '_')}_{dados['semestre'].replace(' ', '_')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{nome_arquivo}"'},
    )
