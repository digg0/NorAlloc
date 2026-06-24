"""Seed dos cursos reais do campus (Letras, Agropecuária e Informática para
Internet), com a matriz curricular completa e um coordenador para cada um.

Os arquivos de origem (Letras.json, curso_materias_agro.json, Infonet.json)
vieram com corrupção de codificação (acentos quebrados); os nomes abaixo já
estão corrigidos manualmente. Campos que o modelo Disciplina não possui
(código da disciplina, período/ano-semestre) não são persistidos — o schema
atual guarda apenas nome, curso e carga horária.

Idempotente: pode ser executado várias vezes sem duplicar registros.

    python -m app.core.seed_cursos_reais
"""
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.coordenador import Coordenador
from app.models.curso import Curso
from app.models.disciplina import Disciplina
from app.models.usuario import Usuario

CURSOS = [
    ("LICENCIATURA EM LETRAS", "Superior"),
    ("TECNICO INTEGRADO EM AGROPECUARIA", "Técnico"),
    ("TECNICO EM INFORMATICA PARA INTERNET", "Técnico"),
]

# (nome, email, senha, curso_nome)
COORDENADORES = [
    ("Francisca Almeida", "francisca.almeida@ifce.edu.br", "coord123", "LICENCIATURA EM LETRAS"),
    ("Antônio Rodrigues", "antonio.rodrigues@ifce.edu.br", "coord123", "TECNICO INTEGRADO EM AGROPECUARIA"),
    ("Juliana Mendes", "juliana.mendes@ifce.edu.br", "coord123", "TECNICO EM INFORMATICA PARA INTERNET"),
]

# (nome, carga_horaria) por curso
DISCIPLINAS = {
    "LICENCIATURA EM LETRAS": [
        ("Português Instrumental", 60),
        ("Redação Científica", 60),
        ("Linguística: Pressupostos Teóricos", 60),
        ("Inglês Instrumental", 60),
        ("Língua Inglesa I", 60),
        ("Cultura Brasileira: Política e Sociedade", 60),
        ("Fundamentos Sócio-Históricos da Educação", 60),
        ("Língua e Cultura Latina I", 60),
        ("Língua Portuguesa I (Morfologia)", 60),
        ("Linguística II (Fonética e Fonologia)", 60),
        ("Língua Inglesa II", 60),
        ("Teoria da Literatura I", 60),
        ("Seminário I: Introdução aos Fundamentos da Docência em Língua Materna (e Estrangeira)", 60),
        ("Laboratório de Leitura e Produção Textual I", 60),
        ("Língua e Cultura Latina II", 60),
        ("Língua Portuguesa II (Sintaxe)", 60),
        ("Linguística III (Semântica e Pragmática)", 60),
        ("Língua Inglesa III", 60),
        ("Teoria da Literatura II", 60),
        ("Laboratório de Leitura e Produção Textual II", 60),
        ("Psicologia da Educação", 60),
        ("Língua Portuguesa III (Morfossintaxe)", 60),
        ("Oficina de Teoria / Redação Literária", 40),
        ("Linguística IV (Psicolinguística)", 60),
        ("Literatura Brasileira I", 60),
        ("Língua Inglesa IV", 60),
        ("Fonética da Língua Inglesa", 60),
        ("Didática Geral", 90),
        ("Linguística V (Sociolinguística)", 60),
        ("Língua Inglesa V (Sintaxe)", 60),
        ("Literatura Brasileira II", 60),
        ("Literatura Portuguesa I", 60),
        ("Literatura Inglesa I", 60),
        ("Metodologia da Pesquisa em Letras", 40),
        ("Estágio: Fundamentos (Língua Portuguesa / Língua Inglesa)", 80),
        ("Literatura Brasileira III", 60),
        ("Literatura Norte-Americana I", 60),
        ("Língua Inglesa VI (Semântica)", 60),
        ("Metodologia do Ensino de Língua Portuguesa", 40),
        ("Metodologia do Ensino de Língua Inglesa", 60),
        ("Políticas Educacionais", 60),
        ("Estágio Supervisionado I: Observação da Prática Docente (Língua Portuguesa / Língua Inglesa)", 90),
        ("Estágio Supervisionado II – Língua Portuguesa", 120),
        ("Estágio Supervisionado II – Língua Inglesa", 120),
        ("Tópicos de Gramática Normativa", 60),
        ("Literatura Norte-Americana II", 60),
        ("Literatura Inglesa II", 60),
        ("Estágio Supervisionado III – Língua Portuguesa", 120),
        ("Estágio Supervisionado III – Língua Inglesa", 120),
        ("Língua Brasileira de Sinais: Fundamentos", 60),
        ("Optativa I", 60),
        ("Optativa II", 60),
        ("Fundamentos de Psicolinguística Aplicados ao Ensino de Língua Estrangeira", 60),
        ("Produção Oral em Língua Inglesa", 60),
        ("Literatura Comparada", 60),
        ("Literatura Cearense", 60),
        ("Literatura Inglesa III", 60),
        ("Análise do Discurso", 60),
        ("Produção Escrita em Língua Inglesa", 60),
        ("Literatura Norte-Americana III", 60),
        ("Semiologia e Comunicação", 60),
        ("Crítica Literária", 60),
        ("Introdução aos Estudos Interculturais", 60),
        ("História da Educação", 60),
        ("Tradução: Fundamentos e Técnicas (Português/Inglês)", 60),
        ("Tópicos de Filosofia da Linguagem", 60),
        ("Educação Física", 60),
        ("Literatura Africana de Expressão em Língua Portuguesa (Panorama Geral)", 60),
        ("Literatura e Filosofia", 60),
        ("Literatura e Sagrado", 60),
        ("Tópicos em Literatura Norte-Americana (Problemáticas da Pós-Modernidade)", 60),
        ("Vozes da Diversidade na Cultura Contemporânea Inglesa/Norte-Americana", 60),
        ("Educação para a Diversidade", 60),
        ("Introdução em Educação a Distância", 60),
        ("Tópicos de Oralidade em Língua Inglesa", 60),
        ("Cultura Britânica", 40),
        ("Cultura Americana", 40),
        ("Gestão Escolar", 40),
        ("Educação de Jovens e Adultos", 40),
        ("Estilística", 40),
    ],
    "TECNICO INTEGRADO EM AGROPECUARIA": [
        ("Artes I", 40),
        ("Artes II", 40),
        ("Artes III", 40),
        ("Educação Física I", 40),
        ("Educação Física II", 40),
        ("Educação Física III", 40),
        ("Língua Portuguesa I", 80),
        ("Língua Portuguesa II", 80),
        ("Língua Portuguesa III", 120),
        ("Língua Inglesa I", 40),
        ("Língua Inglesa II", 40),
        ("Matemática I", 120),
        ("Matemática II", 80),
        ("Matemática III", 80),
        ("Física I", 40),
        ("Física II", 80),
        ("Física III", 40),
        ("Biologia I", 40),
        ("Biologia II", 40),
        ("Biologia III", 80),
        ("Química I", 40),
        ("Química II", 80),
        ("Química III", 40),
        ("Filosofia I", 40),
        ("Filosofia II", 40),
        ("Filosofia III", 40),
        ("História I", 40),
        ("História II", 40),
        ("História III", 40),
        ("Geografia I", 40),
        ("Geografia II", 40),
        ("Geografia III", 40),
        ("Sociologia I", 40),
        ("Sociologia II", 40),
        ("Sociologia III", 40),
        ("Introdução à Agropecuária e Projeto de Vida", 40),
        ("Língua Espanhola", 40),
        ("Empreendedorismo", 40),
        ("Projeto Integrador", 40),
        ("Forragicultura, Alimentos e Alimentação", 80),
        ("Ciências do Solo", 80),
        ("Apicultura e Meliponicultura", 80),
        ("Administração Rural", 40),
        ("Controle de Qualidade", 40),
        ("Mecanização Agrícola", 80),
        ("Olericultura", 80),
        ("Produção de Ruminantes", 80),
        ("Agroindústria", 80),
        ("Culturas Anuais", 80),
        ("Extensão Rural", 80),
        ("Produção de Não Ruminantes", 80),
        ("Fruticultura", 80),
        ("Agroecologia", 40),
        ("Informática Básica", 40),
        ("Olimpíada Brasileira de Astronomia", 40),
        ("Olimpíada Brasileira de Física - Nível I", 40),
        ("Olimpíada Brasileira de Física - Nível II", 40),
        ("Olimpíada Brasileira de Física - Nível III", 40),
        ("Olimpíada Brasileira de Física - Experimental", 40),
        ("Atualidades", 40),
        ("Matemática Básica I", 40),
        ("Matemática Básica II", 40),
        ("Matemática para Olimpíadas", 40),
        ("Oficina de Redação", 40),
        ("Voleibol Misto", 40),
        ("Libras", 40),
        ("Nutrição Animal Básica", 40),
        ("Formulação de Rações", 40),
        ("Produção de Galinha Caipira", 40),
        ("Cooperativismo e Associativismo", 40),
        ("Sistemas de Produção Animal no Semiárido", 40),
        ("Tópicos Especiais em Fisiologia Animal", 40),
        ("Produção de Ovinos e Caprinos no Semiárido", 40),
        ("Bioclimatologia Aplicada às Produções Animais", 40),
    ],
    "TECNICO EM INFORMATICA PARA INTERNET": [
        ("Lógica de Programação", 80),
        ("Produção de Texto Técnico", 40),
        ("Sistemas Operacionais", 80),
        ("Web Design", 80),
        ("Redes de Computadores", 40),
        ("Empreendedorismo", 40),
        ("Projeto Integrador I", 40),
        ("Programação Orientada a Objetos", 80),
        ("Banco de Dados", 80),
        ("Engenharia de Software", 80),
        ("Desenvolvimento Web I", 80),
        ("Servidores", 40),
        ("Projeto Integrador II", 40),
        ("Programação para Dispositivos Móveis", 120),
        ("Análise e Projeto de Sistemas", 40),
        ("Desenvolvimento Web II", 80),
        ("Segurança de Redes", 40),
        ("Gestão de Projetos", 40),
        ("Projeto Integrador III", 80),
        ("Artes", 40),
        ("Educação Física", 40),
        ("Libras", 40),
    ],
}


def seed_cursos_reais() -> None:
    db = SessionLocal()
    try:
        cursos_por_nome = {}
        for nome, nivel in CURSOS:
            curso = db.query(Curso).filter(Curso.nome == nome).first()
            if not curso:
                curso = Curso(nome=nome, nivel=nivel, ativo=True)
                db.add(curso)
                db.flush()
            cursos_por_nome[nome] = curso

        for nome, email, senha, curso_nome in COORDENADORES:
            if db.query(Coordenador).filter(Coordenador.email == email).first():
                continue
            senha_hash = get_password_hash(senha)
            usuario = db.query(Usuario).filter(Usuario.email == email).first()
            if not usuario:
                usuario = Usuario(nome=nome, email=email, senha=senha_hash, tipo="COORDENADOR")
                db.add(usuario)
                db.flush()
            db.add(
                Coordenador(
                    nome=nome,
                    email=email,
                    curso_id=cursos_por_nome[curso_nome].id,
                    hashed_password=senha_hash,
                    usuario_id=usuario.id,
                    ativo=True,
                )
            )

        for curso_nome, disciplinas in DISCIPLINAS.items():
            curso_id = cursos_por_nome[curso_nome].id
            for nome_disc, carga in disciplinas:
                existe = (
                    db.query(Disciplina)
                    .filter(Disciplina.nome == nome_disc, Disciplina.curso_id == curso_id)
                    .first()
                )
                if not existe:
                    db.add(Disciplina(nome=nome_disc, curso_id=curso_id, carga_horaria=carga))

        db.commit()
        print("Cursos reais (Letras, Agropecuária, Informática para Internet) inseridos/confirmados com sucesso.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_cursos_reais()
