"""Importa a matriz curricular real de ADS e Redes de Computadores
(disciplinas_ads.json / disciplinas_redes.json), substituindo as disciplinas
de teste criadas em seed_dados_teste.py, e remove o curso "Licenciatura em
Matemática" (não existe na instituição).

Os arquivos de origem vieram com a mesma corrupção de codificação dos
anteriores; os nomes abaixo já estão corrigidos manualmente. Alguns nomes
do JSON de Redes traziam um prefixo de código colado (ex.: "Soc-I
Sociologia I"); o código foi descartado, mantendo só o nome da disciplina.

Qualquer OfertaDisciplina que apontava para uma disciplina de teste
removida é remapeada para a disciplina real de mesmo nome (quando existe);
se não houver correspondência (caso de "Redes de Computadores", que não
existe na matriz real de Redes), a oferta — e as alocações dela — são
removidas, pois não correspondem a uma disciplina real.

Idempotente: pode ser executado várias vezes sem duplicar registros.

    python -m app.core.seed_disciplinas_reais
"""
from app.core.database import SessionLocal
from app.models.alocacao import Alocacao
from app.models.coordenador import Coordenador
from app.models.curso import Curso
from app.models.disciplina import Disciplina
from app.models.oferta_disciplina import OfertaDisciplina
from app.models.turma import Turma
from app.models.usuario import Usuario

# (nome, carga_horaria)
DISCIPLINAS_ADS = [
    ("Banco de Dados", 80),
    ("Fundamentos de Matemática", 80),
    ("Inglês Técnico", 40),
    ("Introdução à Computação", 40),
    ("Introdução à Programação", 80),
    ("Pensamento Computacional", 40),
    ("Tecnologias WEB", 40),
    ("Comunicação e Expressão", 40),
    ("Empreendedorismo", 40),
    ("Engenharia de Software", 80),
    ("Ética e Responsabilidade Socioambiental", 40),
    ("Programação Orientada a Objetos", 80),
    ("Redes de Computadores", 80),
    ("Análise e Projeto de Sistemas", 80),
    ("Bancos de Dados Não-Relacionais", 40),
    ("Gestão de Projetos", 40),
    ("Interação Humano-Computador", 40),
    ("Programação para Dispositivos Móveis", 80),
    ("Programação WEB I", 80),
    ("Sistemas Operacionais", 40),
    ("Fundamentos de Segurança da Informação", 40),
    ("Inteligência Computacional", 80),
    ("Padrões de Projeto de Software", 80),
    ("Projeto Integrador Multidisciplinar I", 40),
]

DISCIPLINAS_REDES = [
    ("Biologia I", 40),
    ("Física I", 40),
    ("Matemática I", 120),
    ("Química I", 40),
    ("Artes I", 40),
    ("Educação Física Inicial", 40),
    ("Língua Portuguesa I", 80),
    ("Filosofia I", 40),
    ("Sociologia I", 40),
    ("História I", 40),
    ("Geografia I", 40),
    ("Língua Espanhola", 40),
    ("Sistemas Operacionais", 80),
    ("Eletricidade Básica", 80),
    ("Biologia II", 40),
    ("Física II", 80),
    ("Língua Portuguesa II", 80),
    ("Filosofia II", 40),
    ("Sociologia II", 40),
    ("História II", 40),
    ("Geografia II", 40),
    ("Empreendedorismo", 40),
    ("Projeto Integrador", 40),
    ("Matemática II", 80),
    ("Química II", 80),
    ("Artes II", 40),
    ("Educação Física II", 40),
    ("Língua Inglesa I", 40),
    ("Montagem e Manutenção de Computadores", 80),
    ("Lógica de Programação", 80),
    ("Servidores", 120),
    ("Biologia III", 80),
    ("Física III", 40),
    ("Matemática III", 80),
    ("Química III", 40),
    ("Artes III", 40),
    ("Educação Física III", 40),
    ("Língua Inglesa II", 80),
    ("Língua Portuguesa III", 120),
    ("Filosofia III", 40),
    ("Sociologia III", 40),
    ("História III", 40),
    ("Geografia III", 40),
    ("Introdução ao Desenvolvimento Web", 80),
    ("Banco de Dados", 80),
    ("Redes Sem Fio", 80),
    ("Informática Básica", 40),
    ("Atualidades", 40),
    ("Matemática Básica I", 40),
    ("Voleibol Misto", 40),
    ("Oficina de Redação", 40),
    ("Libras", 40),
]


def importar_disciplinas_ads_redes() -> None:
    db = SessionLocal()
    try:
        curso_ads = db.query(Curso).filter(Curso.nome == "ADS").first()
        curso_redes = db.query(Curso).filter(Curso.nome == "REDES DE COMPUTADORES").first()
        if not curso_ads or not curso_redes:
            print("Cursos ADS/Redes não encontrados — rode os seeds anteriores primeiro.")
            return

        # 1. Captura as disciplinas de teste que serão substituídas, e quem
        # as referencia (para remapear por nome depois).
        antigas = (
            db.query(Disciplina)
            .filter(Disciplina.curso_id.in_([curso_ads.id, curso_redes.id]))
            .all()
        )
        nome_por_id_antigo = {d.id: d.nome for d in antigas}
        ofertas_afetadas = (
            db.query(OfertaDisciplina)
            .filter(OfertaDisciplina.disciplina_id.in_(nome_por_id_antigo.keys()))
            .all()
        ) if nome_por_id_antigo else []

        for disciplina in antigas:
            db.delete(disciplina)
        db.flush()

        # 2. Insere a matriz real.
        novo_id_por_nome = {}
        for curso, disciplinas in ((curso_ads, DISCIPLINAS_ADS), (curso_redes, DISCIPLINAS_REDES)):
            for nome, carga in disciplinas:
                nova = Disciplina(nome=nome, curso_id=curso.id, carga_horaria=carga)
                db.add(nova)
                db.flush()
                novo_id_por_nome[(curso.id, nome)] = nova.id

        # 3. Remapeia as ofertas afetadas por nome; remove as que não têm
        # correspondência na matriz real (ex.: "Redes de Computadores" em
        # Redes, que não existe nessa matriz).
        for oferta in ofertas_afetadas:
            nome_antigo = nome_por_id_antigo.get(oferta.disciplina_id)
            turma = oferta.turma
            curso_id = turma.curso_id if turma else None
            novo_id = novo_id_por_nome.get((curso_id, nome_antigo))
            if novo_id:
                oferta.disciplina_id = novo_id
            else:
                db.query(Alocacao).filter(Alocacao.oferta_id == oferta.id).delete(synchronize_session=False)
                db.delete(oferta)

        db.commit()
        print("Disciplinas reais de ADS e Redes de Computadores importadas com sucesso.")
    finally:
        db.close()


def remover_curso_matematica() -> None:
    db = SessionLocal()
    try:
        curso = db.query(Curso).filter(Curso.nome == "LICENCIATURA EM MATEMATICA").first()
        if not curso:
            print("Curso de Matemática já não existe.")
            return

        for coordenador in db.query(Coordenador).filter(Coordenador.curso_id == curso.id).all():
            if coordenador.usuario_id:
                usuario = db.query(Usuario).filter(Usuario.id == coordenador.usuario_id).first()
                if usuario:
                    db.delete(usuario)
            db.delete(coordenador)

        for turma in db.query(Turma).filter(Turma.curso_id == curso.id).all():
            db.delete(turma)

        for disciplina in db.query(Disciplina).filter(Disciplina.curso_id == curso.id).all():
            db.delete(disciplina)

        db.delete(curso)
        db.commit()
        print("Curso Licenciatura em Matemática removido (o professor que era coordenador continua como docente).")
    finally:
        db.close()


if __name__ == "__main__":
    importar_disciplinas_ads_redes()
    remover_curso_matematica()
