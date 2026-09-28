# AGENTS.md — Instruções para agentes de código

## O que é este projeto

Sistema de empréstimo de equipamentos internos (EMPREST.AI): catálogo,
solicitação, devolução e visão de Operações. O produto está definido em
`docs/PRD.md` — leia-o antes de implementar qualquer funcionalidade.
A primeira versão é exatamente o escopo do PRD; **não** implemente o que o
PRD marca como fora da v1 (reserva com data futura, notificação por e-mail,
importação da planilha).

## Documentação

- `docs/PRD.md` — escopo do produto e regras de negócio (limite de 3 itens
  por pessoa, prazo padrão de 14 dias, bloqueio por atraso, manutenção não
  conta como disponível).
- `docs/adr/001-stack.md` — decisões de stack. Não contradiga o ADR; se uma
  mudança exigir rever uma decisão, proponha antes.
- `ARQUITETURA.md` — estrutura de pastas, variáveis de ambiente e fluxo de
  autenticação.
- `docs/layout.md` — especificação visual (design system Nocturne escuro,
  acento teal `#2fb8ac`, tipografia Raleway). Qualquer tela nova ou alterada
  deve seguir este documento.
- `docs/specs/<NNN-funcionalidade>/` — `spec.md`, `plan.md` e `tasks.md` de
  cada funcionalidade. O `docs/` versionado é o do repositório do front
  (`emprest.ai-front`); a cópia de `docs/` na raiz do workspace não é
  versionada. Nenhuma funcionalidade nova começa sem spec: siga
  `rules/spec-flow.md`.
- `docs/handoffs/AAAA-MM-DD-<assunto>.md` — handoff datado de cada
  implementação: onde parei, o que não funcionou e o próximo passo exato
  (`rules/handoff.md`).

## Regras do repositório

A pasta `rules/` existe duas vezes, com conteúdo idêntico: `backend/rules/`
e `frontend/rules/`. Leia a da pasta em que você está mexendo.

- `rules/spec-flow.md` — leia antes de abrir qualquer funcionalidade nova
- `rules/restrictions.md` — leia sempre, antes de qualquer tarefa
- `rules/qualidade-codigo.md` — SOLID aplicado a este código; leia antes de
  escrever ou alterar qualquer arquivo de `src/`
- `rules/checks.md` — execute antes de dizer que uma etapa terminou
- `rules/tests.md` — leia antes de escrever ou mudar teste; a matriz é do
  ADR-001 §8 e nenhum runner está instalado ainda
- `rules/handoff.md` — leia ao retomar e siga ao terminar qualquer
  implementação (handoff datado em `docs/handoffs/`)
- `rules/migration.md` — leia antes de tocar em schema
- `rules/secrets.md` — leia antes de tocar em env, config ou client
- `rules/operacao.md` — o contrato de operação: quem commita, o que exige
  avisar depois e o que exige pedir antes; leia antes de commitar, instalar
  dependência ou mexer em config

## Estrutura

```
backend/    # API NestJS + Prisma (PostgreSQL/Supabase)
frontend/   # SPA React + Vite + Tailwind + shadcn/ui
docs/       # PRD, ADRs e layout
```

## Fluxo de trabalho

- Commit direto na branch principal, sem PR.
- Uma tarefa = um conjunto coeso de mudanças nos dois repositórios quando
  tocar os dois lados.

## Antes de considerar uma tarefa pronta

- Sempre rode **tudo que existir** de verificação: typecheck, lint e testes
  do frontend **e** do backend. Não finalize a tarefa com falha em nenhum
  deles.
- Se a tarefa altera qualquer endpoint da API, exporte o `openapi.json`
  atualizado e regenere o cliente Orval no frontend **antes de terminar**.
  O tipo da resposta no front vem do arquivo gerado, nunca é reescrito à mão.
- Ao terminar qualquer implementação, gere o handoff datado
  (`rules/handoff.md`) antes de dizer que a tarefa está pronta.

## Banco de dados (Prisma)

- Alterações de schema sempre via `prisma migrate dev` com migration nomeada.
- Nunca use `prisma db push`.
- Nunca edite uma migration já aplicada.

## Idioma

Tudo em português do Brasil: commits, comentários de código, documentação e
mensagens para o usuário. (A interface já é pt-BR por definição do layout.)

## Proibições (vêm do ADR-001)

- O frontend **nunca** fala direto com o Supabase para ler/escrever dados;
  toda interação passa pela API NestJS. Supabase no front é apenas a sessão
  (supabase-js).
- Nada de conexão aberta (WebSocket, streaming) nem processamento longo:
  a API roda em serverless na Vercel com limite de 60s.
