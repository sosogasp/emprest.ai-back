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
