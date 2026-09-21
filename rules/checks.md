---
description: O que precisa passar antes de declarar uma tarefa pronta
globs: []
alwaysApply: true
---

# Verificação de fim de tarefa
> leitor: agente

## Quando
Sempre que você for dizer "pronto", "implementado" ou "funcionando".

## Procedimento
1. Rode testes, lint e typecheck nos dois repositórios tocados pela tarefa
   (e nos dois, sempre que a mudança atravessar o contrato):
   - backend: `cd backend && npm run lint && npm run test`
   - frontend: `cd frontend && npm run lint && npx tsc -b`
   Cole a última linha de cada saída na resposta.
   Se algum script ainda não existir no `package.json` recém-scaffoldado,
   declare isso em vez de pular em silêncio.
2. Se a tarefa tocou em migration, rode `npx prisma migrate reset` contra
   um banco **local** e confirme que o banco sobe do zero com todas as
   migrations (incluindo o SQL de RLS, que vive no Prisma Migrate).
   O `.env` real aponta para o Supabase remoto — nunca rode reset com
   `DATABASE_URL`/`DIRECT_DATABASE_URL` do ambiente remoto.
3. Rode build antes de qualquer push — build que quebra na Vercel é o
   feedback mais lento e mais caro deste projeto:
   `cd backend && npm run build && cd ../frontend && npm run build`
4. Rode `git status --short`. Só podem aparecer arquivos do escopo da
   tarefa (`.env` nunca deve aparecer — está no `.gitignore`).
5. Diga qual critério de aceitação esta tarefa atende, citando o item por
   número: os itens 1–5 do `docs/PRD.md` (seção "O que precisa existir na
   primeira versão") ou as regras 1–11 do `docs/layout.md` (seção 7).
   Tarefa que não atende a nenhum item numerado deve dizer isso
   explicitamente.

## Verificação
Pronto = testes, lint, typecheck e build terminaram sem falha E o git
status não trouxe surpresa. As duas coisas, não uma.

## Não faça
- Não relate sucesso parcial. Teste vermelho é tarefa não terminada,
  mesmo que o código "esteja certo".
- Não tente consertar a mesma falha duas vezes seguidas sem me mostrar
  a saída do erro.
- Não rode teste, reset de migration nem build contra o banco remoto do
  Supabase.
