import asyncio
import datetime

from app.api.routers.relatorios import _montar_relatorio, emitir_relatorio_pdf
from app.models.alocacao import Alocacao
from app.models.coordenador import Coordenador
from app.models.curso import Curso
from app.models.disciplina import Disciplina
from app.models.horario import Horario
from app.models.oferta_disciplina import OfertaDisciplina
from app.models.professor import Professor
from app.models.semestre import Semestre
from app.models.turma import Turma


def _criar_base(db):
    curso = Curso(nome="ADS", nivel="Tecnologo")
    db.add(curso)
    db.commit()

    semestre = Semestre(
        nome="2026.1",
        data_inicio=datetime.date(2026, 1, 1),
        data_fim=datetime.date(2026, 6, 30),
        status="ATIVO",
    )
    db.add(semestre)
    db.commit()

    coordenador = Coordenador(
        nome="Saulo", email="saulo@x.com", hashed_password="x", curso_id=curso.id, ativo=True
    )
    db.add(coordenador)
    db.commit()

    turma = Turma(nome="ADS2", curso_id=curso.id, semestre_id=semestre.id, semestre_nivel=2)
    db.add(turma)
    db.commit()

    disciplina = Disciplina(nome="POO", curso_id=curso.id, carga_horaria=4)
    db.add(disciplina)
    db.commit()

    professor = Professor(nome="Joao", email="joao@x.com", regime_trabalho="DE", carga_maxima=20)
    db.add(professor)
    db.commit()

    horario = Horario(
        dia_semana="SEGUNDA", turno="MANHA", hora_inicio=datetime.time(7, 30), hora_fim=datetime.time(8, 20)
    )
    db.add(horario)
    db.commit()

    oferta = OfertaDisciplina(
        turma_id=turma.id, disciplina_id=disciplina.id, professor_id=professor.id, carga_horaria=1
    )
    db.add(oferta)
    db.commit()

    db.add(Alocacao(oferta_id=oferta.id, horario_id=horario.id))
    db.commit()

    return curso, semestre


def test_monta_relatorio_com_dados_reais(db):
    curso, semestre = _criar_base(db)

    dados = _montar_relatorio(curso.id, semestre.id, db)

    assert dados["curso"] == "ADS"
    assert dados["coordenador"] == "Saulo"
    assert dados["resumo"] == {"turmas": 1, "disciplinas": 1, "professores": 1, "carga_total": 1}
    assert dados["turmas"][0]["grade"][0]["dia"] == "SEGUNDA"
    assert dados["turmas"][0]["grade"][0]["horario"] == "07:30"
    assert dados["professores_envolvidos"] == ["Joao"]
    assert dados["disciplinas_ofertadas"] == ["POO"]


def test_exporta_pdf_valido(db):
    curso, semestre = _criar_base(db)

    resposta = emitir_relatorio_pdf(curso.id, semestre.id, db)

    async def coletar():
        partes = [chunk async for chunk in resposta.body_iterator]
        return b"".join(p if isinstance(p, bytes) else p.encode() for p in partes)

    conteudo = asyncio.run(coletar())
    assert resposta.media_type == "application/pdf"
    assert conteudo[:4] == b"%PDF"
