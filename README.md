# NorAlloc — Sistema de Alocação de Horários Acadêmicos

Sistema web para gestão e alocação de horários do IFCE. Permite que coordenadores configurem semestres, vinculem turmas, disciplinas e professores, e (futuramente) gerem a grade automaticamente via solver.

---

## O que o sistema faz

| Papel | Funcionalidades |
|-------|----------------|
| **Admin** | Cadastra coordenadores, professores, cursos. Visualiza dashboard geral. |
| **Coordenador** | Cria semestres, turmas e ofertas (disciplina + professor). Configura restrições de horário. Gera relatórios. |
| **Professor** | Visualiza sua agenda, marca horários indisponíveis, registra situação (ativo/afastado/carga reduzida). |

### Fluxo principal (Wizard do Coordenador)

1. **Criar semestre** — nome, datas de início e fim
2. **Configurar ofertas** — adicionar turmas ao semestre, vincular disciplinas e professores a cada turma
3. **Alocar professores e restrições** — atribuir professor a cada oferta, marcar horários bloqueados
4. **Simulação** — executar o solver para gerar a grade (em desenvolvimento)

### Dados pré-carregados

Ao subir o sistema pela primeira vez, o seed já cria automaticamente:

- **3 usuários** de teste (admin, coordenador, professor)
- **4 cursos** com **206 disciplinas** importadas das grades curriculares reais do IFCE
- **14 slots de horário** padrão (manhã, tarde, noite)

---

## Tecnologias

| Camada | Stack |
|--------|-------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Shadcn/UI |
| Backend | Python 3.11, FastAPI, SQLAlchemy, Alembic, JWT (HS256) |
| Banco de dados | PostgreSQL 15 |
| Infra | Docker, Docker Compose, GitHub Actions |

---

## Estrutura do projeto

```
NorAlloc/
├── backend-python/          # API FastAPI
│   ├── app/
│   │   ├── api/routers/     # Endpoints REST
│   │   ├── core/            # Database, auth, seed, curriculos
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   └── data/            # Grades curriculares (JSON)
│   ├── alembic/             # Migrations
│   ├── Dockerfile
│   └── requirements.txt
├── frontend-react/          # SPA React
│   ├── src/app/
│   │   ├── App.tsx          # Aplicação principal
│   │   └── services/        # Camada de API (fetch + tipos)
│   ├── Dockerfile
│   └── package.json
├── database/                # Scripts SQL (estrutura inicial)
├── docker-compose.yml
├── .env.example             # Variáveis de ambiente (copiar para .env)
└── README.md
```

---

## Como rodar

### Pré-requisitos

- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

Verifique se estão instalados:

```bash
git --version
docker --version
docker compose version
```

### 1. Clone o repositório

```bash
git clone https://github.com/digg0/NorAlloc.git
cd NorAlloc
git checkout develop
```

### 2. Configure o ambiente

```bash
# Linux / Mac
cp .env.example .env

# Windows (PowerShell)
copy .env.example .env
```

Os valores padrão do `.env.example` já funcionam com o Docker Compose.

### 3. Suba os containers

**Primeira vez** (constrói as imagens):

```bash
docker compose up --build
```

**Vezes seguintes** (em segundo plano):

```bash
docker compose up -d
```

Aguarde os logs indicarem que backend e frontend estão prontos (~1-2 minutos na primeira vez).

### 4. Acesse o sistema

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend (API docs) | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |

---

## Credenciais de teste

O sistema cria 3 contas automaticamente no primeiro boot:

| Papel | E-mail | Senha |
|-------|--------|-------|
| Admin | `admin@ifce.edu.br` | `admin` |
| Coordenador | `saulo.anderson@ifce.edu.br` | `123456` |
| Professor | `ana.silva@ifce.edu.br` | `prof123` |

---

## Comandos úteis

```bash
# Subir tudo em segundo plano
docker compose up -d

# Ver logs em tempo real
docker compose logs -f

# Logs só do backend
docker compose logs -f backend

# Logs só do frontend
docker compose logs -f frontend

# Parar tudo
docker compose down

# Reconstruir do zero (limpa o banco)
docker compose down -v && docker compose up --build

# Subir apenas um serviço
docker compose up -d backend
docker compose up -d frontend
docker compose up -d database
```

---

## Fluxo de trabalho (GitFlow)

- **Nunca** faça commit diretamente em `main` ou `develop`
- Crie uma branch a partir de `develop`:

```bash
git checkout develop
git checkout -b feature/nome-da-feature
```

### Padrão de commits

```
feat: cria tela de login
fix: corrige erro de autenticação
refactor: melhora estrutura da autenticação
chore: atualiza dependências
docs: atualiza README
```

### Pull Request

1. Faça commit e push da sua branch
2. Abra um PR direcionado para `develop`
3. Aguarde o CI passar e a revisão ser aprovada

---

## Equipe

Projeto desenvolvido pela equipe NorDev — IFCE.
