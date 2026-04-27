# 📅 Sistema de Gestão de Horários

Bem-vindos ao repositório oficial do Sistema de Gestão de Horários. Este projeto utiliza uma arquitetura de **Monorepo**, garantindo que o Frontend, BFF e Backend convivam no mesmo repositório com versionamento unificado, mas operando em ambientes isolados via Docker.

## 🏗️ Estrutura do Projeto (Quem mexe onde?)

Nossa arquitetura está dividida nas seguintes pastas:

* 🖥️ **`desktop-app/` (O Salão):** Interface do usuário. Desenvolvido com React + Electron. (Frontend)
* ⚙️ **`middleware-node/` (O Balcão):** Nosso BFF (Backend For Frontend). Recebe os pedidos do app, filtra e se comunica com o Java. Desenvolvido em Node.js (v18).
* ☕ **`api-java/` (A Cozinha):** Backend Core e regras de negócio. Desenvolvido em Java (v17) + Spring Boot.
* 🗄️ **`database/` (O Estoque):** Scripts estruturais e tabelas do PostgreSQL. (O banco de dados real roda em um volume oculto do Docker).

---

## 🚀 Como rodar o projeto na sua máquina (Dia 1)

Graças à nossa infraestrutura conteinerizada, **você não precisa instalar Java, Node ou Postgres no seu computador**. O Docker fará todo o trabalho pesado.

### Pré-requisitos:
1. Ter o [Git](https://git-scm.com/) instalado.
2. Ter o [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando.

### Passo a Passo:

1. **Clone o repositório:**
   ```bash
   git clone <COLOQUE-O-LINK-DO-SEU-GITHUB-AQUI>
   ```

2. **Entre na pasta do projeto:**
   ```bash
   cd gestao-horarios
   ```

3. **Mude para a branch de desenvolvimento (Chão de fábrica):**
   ```bash
   git checkout develop
   ```

4. **Suba todo o ambiente mágico:**
   ```bash
   docker-compose up -d
   ```
   *(O parâmetro `-d` roda os servidores em segundo plano para não travar o seu terminal).*

Pronto! Os containers do Java, Node e Banco de Dados já estão rodando isolados e mapeados para as pastas do seu computador. Tudo o que você codar na sua pasta será refletido imediatamente no container.

---

## 🛠️ Regras de Fluxo de Trabalho (GitFlow)

Para mantermos o projeto organizado e a esteira de CI/CD funcionando, siga estas regras:

1. **Nunca comite na `main` ou na `develop`.**

2. Vai criar uma tela nova ou consertar um erro? Crie uma branch a partir da `develop`:
   ```bash
   git checkout -b feature/nome-da-sua-tela
   ```
3. Use o padrão **Conventional Commits** nas suas mensagens:
   * `feat: cria botão de login` (Funcionalidade nova)
   * `fix: corrige erro na listagem` (Correção de bug)
   * `chore: atualiza pacotes` (Manutenção/Organização)

4. Quando terminar, faça o Push da sua branch e abra um **Pull Request (PR) apontando para a `develop`**.

5. Nossos robôs do GitHub Actions vão testar o seu código automaticamente. Se tudo ficar verde, o PR pode ser aprovado!

---
*Mantido pela equipe de Infraestrutura.*