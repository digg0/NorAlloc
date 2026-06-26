"""Carga das grades curriculares (cursos + disciplinas) a partir de JSONs versionados.

Os arquivos ficam em ``app/data/grades_curriculares/*.json`` e seguem o formato:

    {
      "nome_curso": "Análise e Desenvolvimento de Sistemas",
      "nivel_curso": "Superior",
      "disciplinas": [
        {"nome": "Banco de Dados", "codigo": "ADS01",
         "carga_horaria": 80, "ano_semestre": 1},
        ...
      ]
    }

`codigo`, `carga_horaria` e `ano_semestre` são opcionais (alguns currículos não
trazem todos). A carga é populada no banco no startup, de forma idempotente.
"""
import glob
import json
import os

CURRICULOS_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "grades_curriculares")


def _demojibake(valor):
    """Corrige texto UTF-8 que foi salvo/lido como Latin-1 (mojibake).

    Ex.: "AnÃ¡lise" -> "Análise". Se o texto já estiver correto, retorna como
    está. Mantém o valor original caso o round-trip não seja possível.
    """
    if not isinstance(valor, str) or not valor:
        return valor
    if "Ã" in valor or "Â" in valor:
        try:
            return valor.encode("latin-1").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            return valor
    return valor


def _carregar_arquivos():
    """Lê todos os JSONs do diretório de currículos (ordenados por nome)."""
    if not os.path.isdir(CURRICULOS_DIR):
        return []
    dados = []
    for caminho in sorted(glob.glob(os.path.join(CURRICULOS_DIR, "*.json"))):
        try:
            with open(caminho, encoding="utf-8") as fp:
                dados.append(json.load(fp))
        except (OSError, json.JSONDecodeError):
            # Um arquivo inválido não deve derrubar o seed dos demais.
            continue
    return dados


def seed_curriculos(db) -> int:
    """Popula cursos e disciplinas a partir dos JSONs.

    Idempotente: curso identificado por nome; disciplina por (curso, nome).
    Retorna quantos registros foram criados (sem commitar — quem chama commita).
    """
    from app.models.curso import Curso
    from app.models.disciplina import Disciplina

    criados = 0
    for curriculo in _carregar_arquivos():
        nome_curso = _demojibake(curriculo.get("nome_curso", "")).strip()
        if not nome_curso:
            continue
        nivel = _demojibake(curriculo.get("nivel_curso", "")).strip() or "Superior"

        curso = db.query(Curso).filter(Curso.nome == nome_curso).first()
        if not curso:
            curso = Curso(nome=nome_curso, nivel=nivel)
            db.add(curso)
            db.flush()  # garante curso.id para as disciplinas
            criados += 1

        for d in curriculo.get("disciplinas", []):
            nome_disc = _demojibake(d.get("nome", "")).strip()
            if not nome_disc:
                continue
            ja_existe = (
                db.query(Disciplina)
                .filter(Disciplina.curso_id == curso.id, Disciplina.nome == nome_disc)
                .first()
            )
            if ja_existe:
                continue
            db.add(Disciplina(
                curso_id=curso.id,
                nome=nome_disc,
                codigo=_demojibake(d.get("codigo")),
                carga_horaria=d.get("carga_horaria"),
                ano_semestre=d.get("ano_semestre"),
            ))
            criados += 1

    return criados
