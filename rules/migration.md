---
description: Procedimento para qualquer mudança de schema
globs: ["backend/prisma/migrations/**", "backend/prisma/schema.prisma"]
alwaysApply: false
---

# Mudança de schema
> leitor: agente

## Quando
Qualquer tarefa que precise criar, alterar ou remover tabela, coluna,
índice, constraint ou política de acesso (RLS) — inclusive quando a
mudança parecer trivial.

## Procedimento
1. Antes de gerar qualquer coisa: escreva na resposta o diff pretendido
   no `schema.prisma` E o SQL de RLS pretendido, e PARE. Eu aprovo ou
   corrijo.
2. Gere a migration pelo Prisma com
   `npx prisma migrate dev --name <nome> --create-only` (gera o arquivo
   sem aplicar). Uma migration por tarefa. Nunca `prisma db push`.
3. Toda tabela nova nasce com Row Level Security habilitada e pelo
   menos uma policy explícita **na mesma migration** — o SQL da policy
   entra no arquivo da migration criado no passo 2, antes de aplicar
   (por isso o `--create-only`). Tabela sem policy não entra no
   repositório. A policy precisa ser coerente com os guards CASL do
   backend: o ADR-001 avisa que policy desatualizada dá falsa sensação
   de proteção.
4. Se a tabela já tem dado, diga o que acontece com as linhas
   existentes. Coluna obrigatória nova precisa de default ou de um
   passo de preenchimento dentro da mesma migration.
5. Aplique com `npx prisma migrate dev` contra banco **local** e rode
   os checks do rules/checks.md.

## Verificação
`npx prisma migrate reset` contra um banco local limpo aplica todas as
migrations do zero — schema e RLS —, sem erro e sem nenhum passo manual.

## Não faça
- Não altere schema pelo Studio do Supabase, por SQL avulso nem por
  `prisma db push`. O que não está em migration não existe.
- Não edite migration que já foi aplicada ou que já foi para o
  repositório remoto. Escreva a próxima.
- Não toque no projeto Supabase remoto. Tudo acontece no banco local —
  o `.env` real aponta para o Supabase remoto; o reset nunca usa essas
  credenciais.
