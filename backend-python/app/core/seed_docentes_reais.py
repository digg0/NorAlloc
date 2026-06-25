"""Seed dos docentes reais do campus (docentes.json), substituindo os
professores/coordenadores inventados nas fases anteriores de teste.

Os 49 docentes abaixo são professores gerais da instituição — aparecem para
todos os coordenadores ao montar ofertas, independente do curso. Seis deles
também são coordenadores (um por curso já cadastrado), pois coordenadores
são docentes da instituição, não contas avulsas.

`data_ingresso` é usada pelo solver como critério de desempate entre
professores quando há disputa de preferência pelo mesmo horário (mais
antigo no campus vence; em empate, usa `data_nascimento`, ainda não
disponível nos dados de origem — fica nula até ser informada).

Idempotente: pode ser executado várias vezes sem duplicar registros.

    python -m app.core.seed_docentes_reais
"""
import re
import unicodedata
from datetime import datetime

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.coordenador import Coordenador
from app.models.curso import Curso
from app.models.oferta_disciplina import OfertaDisciplina
from app.models.professor import Professor
from app.models.usuario import Usuario

# Dados invemtados nas fases de teste anteriores, a remover.
PROFESSORES_FAKE = ["Carlos Silva", "Patrícia Oliveira", "Ricardo Souza"]
COORDENADORES_FAKE_EMAILS = [
    "maria.santos@ifce.edu.br",
    "joao.pereira@ifce.edu.br",
    "ana.costa@ifce.edu.br",
    "francisca.almeida@ifce.edu.br",
    "antonio.rodrigues@ifce.edu.br",
    "juliana.mendes@ifce.edu.br",
]

DOCENTES = [
    ("Adriana Merly Farias", "07/02/2023"),
    ("Alan Medeiros Casteluber", "07/02/2023"),
    ("Amarilton Lopes Magalhaes", "24/04/2019"),
    ("Anelise Daniela Schinaider", "28/01/2021"),
    ("Antonio Bruno Sales Dias", "21/02/2024"),
    ("Antonio Savio Silva Oliveira", "14/06/2019"),
    ("Carlos Getulio de Freitas Maia", "14/06/2019"),
    ("Cledinaldo Alves Pinheiro Junior", "24/04/2019"),
    ("Clice de Araujo Mendonca", "10/06/2025"),
    ("Dieyme de Souza Silva", "17/04/2023"),
    ("Edson Alencar Collares de Bessa", "24/04/2019"),
    ("Elpida Andreia de Queiroz Nikokavouras", "24/04/2019"),
    ("Erico Castro de Albuquerque Melo", "07/02/2023"),
    ("Francisca Patrícia da Conceição", "03/07/2024"),
    ("Francisco Alan da Silva Monteiro", "27/03/2024"),
    ("Gabriela Ismerim Lacerda", "19/07/2022"),
    ("Jayme Felix Xavier Junior", "14/07/2016"),
    ("Jessica Nunes Caldeira Cunha", "07/02/2023"),
    ("Jhonata da Costa Bezerra", "24/04/2019"),
    ("Joao Paulo Saraiva Pires", "27/04/2023"),
    ("Jonas Brito dos Santos", "07/03/2024"),
    ("Jose Alves de Oliveira Neto", "04/11/2010"),
    ("Julio Serafim Martins", "03/05/2021"),
    ("Jussara Teixeira de Araujo Goncalves", "04/04/2025"),
    ("Karina de Morais e Silva", "22/02/2024"),
    ("Kelvia Jacome de Castro", "05/01/2016"),
    ("Kleiane Bezerra de Sa", "07/02/2023"),
    ("Leandro Vidal Carneiro", "02/07/2024"),
    ("Lia Leite Santos", "25/06/2025"),
    ("Lia Nojosa Sena", "02/07/2024"),
    ("Lucas Ferreira Mendes", "10/07/2017"),
    ("Marcelo Henrique de Araujo Santos Costa", "07/02/2023"),
    ("Marcus Vinicius de Paula", "19/07/2022"),
    ("Marinaldo de Almeida Cunha", "07/02/2023"),
    ("Marselle Marmo do Nascimento Silva", "21/02/2024"),
    ("Mauricio Custodio da Silva", "02/07/2024"),
    ("Nadia de Melo Braz", "14/06/2019"),
    ("Paulo Ricardo Barboza Gomes", "17/07/2022"),
    ("Phyllipe do Carmo Felix", "22/02/2024"),
    ("Rafaela de Carvalho Baptista", "22/02/2024"),
    ("Raquel Vieira Sobrinho", "07/02/2023"),
    ("Regiane Goncalves Feitosa Leal Nunes", "07/06/2022"),
    ("Reginaldo Pereira Fernandes", "24/04/2019"),
    ("Roberto Luis Alexandrino Feitosa", "13/07/2012"),
    ("Samuel Alves Soares", "10/07/2017"),
    ("Samuel Barbosa Silva", "19/07/2022"),
    ("Saulo Anderson Freitas de Oliveira", "24/04/2019"),
    ("Tiago de Sousa Leite", "19/07/2022"),
    ("Weberte Alan Sombra", "30/10/2012"),
    ("Willame de Araujo Cavalcante", "10/07/2017"),
]

# (nome completo, curso_nome) — coordenadores são docentes da instituição.
# A escolha de qual docente coordena qual curso é arbitrária (a fonte de
# dados não informa área/curso de cada um); ajuste depois se necessário.
COORDENADORES_POR_CURSO = [
    ("Saulo Anderson Freitas de Oliveira", "ADS"),
    ("Carlos Getulio de Freitas Maia", "REDES DE COMPUTADORES"),
    ("Julio Serafim Martins", "LICENCIATURA EM MATEMATICA"),
    ("Jussara Teixeira de Araujo Goncalves", "LICENCIATURA EM LETRAS"),
    ("Amarilton Lopes Magalhaes", "TECNICO INTEGRADO EM AGROPECUARIA"),
    ("Lucas Ferreira Mendes", "TECNICO EM INFORMATICA PARA INTERNET"),
]

SAULO_EMAIL_EXISTENTE = "saulo.anderson@ifce.edu.br"

CARGA_POR_REGIME = {"DE": 20, "40H": 40, "20H": 20}


def _slug(nome: str) -> str:
    sem_acento = unicodedata.normalize("NFKD", nome).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z]", "", sem_acento.lower())


def _gerar_email(nome: str, usados: set) -> str:
    partes = nome.split()
    primeiro, ultimo = _slug(partes[0]), _slug(partes[-1])
    base = f"{primeiro}.{ultimo}"
    email = f"{base}@ifce.edu.br"
    contador = 2
    while email in usados:
        email = f"{base}{contador}@ifce.edu.br"
        contador += 1
    usados.add(email)
    return email


def seed_docentes_reais() -> None:
    db = SessionLocal()
    try:
        # 1. Remove os dados inventados nas fases de teste anteriores (caso
        # ainda existam num banco criado antes deste script).
        ofertas_fake = (
            db.query(OfertaDisciplina)
            .join(Professor, OfertaDisciplina.professor_id == Professor.id)
            .filter(Professor.nome.in_(PROFESSORES_FAKE))
            .all()
        )
        for oferta in ofertas_fake:
            oferta.professor_id = None  # reatribuído após criar os docentes reais

        for nome in PROFESSORES_FAKE:
            professor = db.query(Professor).filter(Professor.nome == nome).first()
            if professor:
                db.delete(professor)

        for email in COORDENADORES_FAKE_EMAILS:
            coordenador = db.query(Coordenador).filter(Coordenador.email == email).first()
            if coordenador:
                db.delete(coordenador)
            usuario = db.query(Usuario).filter(Usuario.email == email).first()
            if usuario:
                db.delete(usuario)

        db.flush()

        # 2. Insere os 49 docentes reais.
        emails_em_uso = {u.email for u in db.query(Usuario.email).all() if u.email} | {
            p.email for p in db.query(Professor.email).all() if p.email
        }
        professores_por_nome = {}
        for nome, data_str in DOCENTES:
            existente = db.query(Professor).filter(Professor.nome == nome).first()
            if existente:
                professores_por_nome[nome] = existente
                continue
            data_ingresso = datetime.strptime(data_str, "%d/%m/%Y").date()
            if nome == "Saulo Anderson Freitas de Oliveira":
                # Já existe conta de login com esse e-mail (seed demo); usa o
                # mesmo, em vez de gerar um e-mail novo a partir do nome.
                email = SAULO_EMAIL_EXISTENTE
                emails_em_uso.add(email)
            else:
                email = _gerar_email(nome, emails_em_uso)
            regime = "DE"
            novo = Professor(
                nome=nome,
                email=email,
                regime_trabalho=regime,
                carga_maxima=CARGA_POR_REGIME[regime],
                afastado=False,
                data_ingresso=data_ingresso,
            )
            db.add(novo)
            db.flush()
            professores_por_nome[nome] = novo

        # 3. Reatribui qualquer oferta sem professor (dos fakes removidos, ou
        # criada sem professor por seed_dados_teste.py) para o
        # coordenador-docente do curso da turma, quando possível.
        cursos_por_nome = {c.nome: c for c in db.query(Curso).all()}
        coordenador_professor_por_curso_id = {}
        for nome_docente, curso_nome in COORDENADORES_POR_CURSO:
            curso = cursos_por_nome.get(curso_nome)
            if curso:
                coordenador_professor_por_curso_id[curso.id] = professores_por_nome[nome_docente]

        ofertas_sem_professor = set(ofertas_fake) | set(
            db.query(OfertaDisciplina).filter(OfertaDisciplina.professor_id.is_(None)).all()
        )
        for oferta in ofertas_sem_professor:
            turma = oferta.turma
            substituto = coordenador_professor_por_curso_id.get(turma.curso_id) if turma else None
            if substituto:
                oferta.professor_id = substituto.id

        # 4. Cria os 6 coordenadores (docentes reais) vinculados ao curso.
        for nome_docente, curso_nome in COORDENADORES_POR_CURSO:
            curso = cursos_por_nome.get(curso_nome)
            if not curso:
                continue
            professor = professores_por_nome[nome_docente]

            if db.query(Coordenador).filter(Coordenador.professor_id == professor.id).first():
                continue  # já é coordenador

            if nome_docente == "Saulo Anderson Freitas de Oliveira":
                usuario = db.query(Usuario).filter(Usuario.email == SAULO_EMAIL_EXISTENTE).first()
                usuario.nome = nome_docente
                usuario.tipo = "COORDENADOR"
                senha_hash = usuario.senha
                email_coord = SAULO_EMAIL_EXISTENTE
            else:
                email_coord = professor.email
                senha_hash = get_password_hash("coord123")
                usuario = db.query(Usuario).filter(Usuario.email == email_coord).first()
                if not usuario:
                    usuario = Usuario(nome=nome_docente, email=email_coord, senha=senha_hash, tipo="COORDENADOR")
                    db.add(usuario)
                    db.flush()
                else:
                    usuario.senha = senha_hash
                    usuario.tipo = "COORDENADOR"

            db.add(
                Coordenador(
                    nome=nome_docente,
                    email=email_coord,
                    curso_id=curso.id,
                    professor_id=professor.id,
                    hashed_password=senha_hash,
                    usuario_id=usuario.id,
                    ativo=True,
                )
            )

        # 5. Coordenador de curso tem carga de ensino reduzida — o NORMAS.pdf
        # diz "preferencialmente 10h semanais quando possível" (não é
        # obrigatório que ele dê aula, mas se der, o limite é menor que o
        # dos demais docentes, que ficam com 20h).
        for nome_docente, _curso_nome in COORDENADORES_POR_CURSO:
            professores_por_nome[nome_docente].carga_maxima = 10

        # 6. Garante login para todos os docentes que ainda não têm conta
        # (os 6 coordenadores já têm, criada no passo 4). Senha padrão:
        # primeiro nome (sem acento, minúsculo) + "123".
        for nome, _data_str in DOCENTES:
            professor = professores_por_nome[nome]
            if professor.usuario_id:
                continue
            primeiro_nome = _slug(nome.split()[0])
            senha_hash = get_password_hash(f"{primeiro_nome}123")
            usuario = db.query(Usuario).filter(Usuario.email == professor.email).first()
            if not usuario:
                usuario = Usuario(nome=professor.nome, email=professor.email, senha=senha_hash, tipo="PROFESSOR")
                db.add(usuario)
                db.flush()
            professor.usuario_id = usuario.id

        db.commit()
        print("Docentes reais inseridos, logins criados e coordenadores vinculados com sucesso.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_docentes_reais()
