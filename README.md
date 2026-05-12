# 📅 Sistema de Gestão de Horários

Bem-vindos ao repositório oficial do **Sistema de Gestão de Horários**.

Este projeto utiliza uma arquitetura **Monorepo**, garantindo que Frontend, Backend e Banco de Dados convivam no mesmo repositório com versionamento unificado, mas operando em ambientes isolados via Docker.

---

# 🏗️ Estrutura do Projeto (Quem mexe onde?)

Nossa arquitetura está organizada nas seguintes pastas:

```bash
.github/
└── workflows/              # Pipelines e automações do GitHub Actions

backend-python/             # Backend principal da aplicação (Python)

database/                   # Scripts SQL e estrutura do PostgreSQL

frontend-react/             # Frontend da aplicação desenvolvido em React

.env                        # Variáveis de ambiente locais
.env.example                # Exemplo de configuração das variáveis

.gitignore                  # Arquivos ignorados pelo Git

docker-compose.yml          # Orquestração dos containers Docker

README.md                   # Documentação principal do projeto
```

---

# 🚀 Como rodar o projeto na sua máquina (Dia 1)

Graças à nossa infraestrutura conteinerizada, **você não precisa instalar Python, Node ou PostgreSQL no seu computador**.

O Docker fará todo o trabalho pesado.

---

# ✅ Pré-requisitos

Antes de começar, você precisa ter instalado na sua máquina:

## 1️⃣ Git

Download oficial:

```txt
https://git-scm.com/
```

Verifique se está instalado:

```bash
git --version
```

---

## 2️⃣ Docker Desktop

Download oficial:

```txt
https://www.docker.com/products/docker-desktop/
```

Verifique se está rodando:

```bash
docker --version
docker compose version
```

---

# 📥 Clonando o Projeto

## 1️⃣ Clone o repositório

```bash
git clone <COLOQUE-O-LINK-DO-SEU-GITHUB-AQUI>
```

---

## 2️⃣ Entre na pasta do projeto

```bash
cd gestao-horarios
```

---

## 3️⃣ Vá para a branch de desenvolvimento

```bash
git checkout develop
```

---

# ⚙️ Configuração do Ambiente

## Copie o arquivo `.env.example`

Crie seu arquivo `.env` local:

### Linux / Mac

```bash
cp .env.example .env
```

### Windows (PowerShell)

```powershell
copy .env.example .env
```

---

# 🐳 Docker — Primeira Execução

## 🔥 IMPORTANTE

Na primeira vez que rodar o projeto, utilize:

```bash
docker compose up --build
```

Esse comando irá:

- Construir todas as imagens Docker
- Instalar dependências automaticamente
- Criar os containers
- Configurar a rede interna
- Inicializar banco de dados
- Subir backend e frontend

⚠️ Esse processo pode demorar alguns minutos na primeira execução.

---

# ⚡ Execuções Futuras

Depois que as imagens já estiverem criadas, utilize:

```bash
docker compose up -d
```

O parâmetro `-d` executa os containers em segundo plano.

---

# 🎯 Rodando Apenas Um Serviço

Você também pode subir apenas um container específico.

---

## 🖥️ Subir apenas o Frontend

```bash
docker compose up -d frontend
```

---

## ⚙️ Subir apenas o Backend

```bash
docker compose up -d backend
```

---

## 🗄️ Subir apenas o Banco de Dados

```bash
docker compose up -d database
```

---

# 🛑 Parando os Containers

Para parar todos os containers:

```bash
docker compose down
```

---

# 🔄 Reiniciando os Containers

```bash
docker compose restart
```

---

# 📜 Visualizando Logs

## Logs de todos os serviços

```bash
docker compose logs -f
```

---

## Logs apenas do backend

```bash
docker compose logs -f backend
```

---

## Logs apenas do frontend

```bash
docker compose logs -f frontend
```

---

# 🌐 Endereços da Aplicação

Após subir os containers:

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8000 |
| PostgreSQL | localhost:5432 |

---

# 🛠️ Fluxo de Trabalho (GitFlow)

Para mantermos o projeto organizado e a esteira de CI/CD funcionando corretamente, siga estas regras.

---

# ❌ Nunca faça commit diretamente em:

- `main`
- `develop`

---

# 🌱 Sempre crie uma branch nova

Exemplo:

```bash
git checkout -b feature/nome-da-feature
```

---

# ✍️ Padrão de Commits (Conventional Commits)

Utilize os padrões abaixo:

---

## ✨ Nova funcionalidade

```bash
feat: cria tela de login
```

---

## 🐛 Correção de bug

```bash
fix: corrige erro de autenticação
```

---

## 🧹 Organização / manutenção

```bash
chore: atualiza dependências
```

---

## ♻️ Refatoração

```bash
refactor: melhora estrutura da autenticação
```

---

## 📚 Documentação

```bash
docs: atualiza README
```

---

# 🔄 Pull Requests

Quando finalizar sua tarefa:

1. Faça commit das alterações
2. Faça push da sua branch
3. Abra um Pull Request
4. Direcione o PR para `develop`

---

# 🤖 CI/CD Automático

Nossos workflows do GitHub Actions executam automaticamente:

- Testes
- Build da aplicação
- Verificações de qualidade
- Lint
- Validação de PR

Se tudo estiver verde ✅, o PR poderá ser aprovado.

---

# 📌 Observações Importantes

- Os containers compartilham os arquivos locais via volumes Docker.
- Toda alteração feita no código é refletida automaticamente no container.
- O banco PostgreSQL utiliza persistência via volume Docker.
- Não é necessário instalar dependências localmente.
- Toda a stack roda isolada via containers.

---

# 🧹 Comandos Úteis

## Rebuildar os containers

```bash
docker compose up --build
```


---

# 📂 Tecnologias Utilizadas

## Frontend

- React
- Vite
- JavaScript

---

## Backend

- Python
- FastAPI

---

## Banco de Dados

- PostgreSQL

---

## DevOps

- Docker
- Docker Compose
- GitHub Actions

---

# 👨‍💻 Equipe

Projeto mantido pela equipe de Infraestrutura e Desenvolvimento da Nordev.

---
