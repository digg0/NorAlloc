# Grades Curriculares (cursos + disciplinas)

Cada arquivo `*.json` deste diretório descreve um curso e sua grade curricular.
No startup, `seed_curriculos()` (em `app/core/curriculos.py`) lê todos os JSONs e
popula as tabelas `cursos` e `disciplinas` de forma **idempotente** (não duplica
em reinícios). Isso garante que, num banco novo, o sistema já vem com todos os
cursos e disciplinas cadastrados.

## Formato

```json
{
  "nome_curso": "Análise e Desenvolvimento de Sistemas",
  "nivel_curso": "Superior",
  "disciplinas": [
    { "nome": "Banco de Dados", "codigo": "ADS01", "carga_horaria": 80, "ano_semestre": 1 }
  ]
}
```

- `codigo`, `carga_horaria` e `ano_semestre` são **opcionais**.
- O loader corrige automaticamente acentos quebrados (mojibake, ex.: `AnÃ¡lise`),
  desde que o arquivo no disco esteja com os bytes íntegros.

## Como adicionar/atualizar
1. Coloque o `.json` do curso aqui (um arquivo por curso).
2. Recrie o banco para repopular: `docker compose down -v && docker compose up -d`.

## Arquivos esperados
- `ads.json` — Análise e Desenvolvimento de Sistemas
- `letras.json` — Licenciatura em Letras
- `agropecuaria.json` — Técnico Integrado em Agropecuária
- `informatica_internet.json` — Técnico em Informática para Internet
- `redes_medio.json` — Redes de Computadores (Ensino Médio) — _pendente_
