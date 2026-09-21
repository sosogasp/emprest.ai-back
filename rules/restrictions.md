---
description: O que o agente não pode fazer neste projeto
globs: []
alwaysApply: true
---

# O que não fazer
> leitor: agente

## Autoridade

- Não escreva ADR. Se encontrar uma decisão que precisa de um, descreva
  a decisão e as alternativas, e PARE. Quem decide é o time.
- Não contrarie o que está em docs/adr/. Se precisar contrariar, pare.
- Não responda por conta própria o que o PRD deixou ambíguo. Liste as
  perguntas e espere.
- Não escolha biblioteca que não esteja no ADR-001. Proponha e espere.

## Escopo

- Não altere arquivo fora do escopo da tarefa atual (o `git status --short`
  do checks.md é quem confere isso).
- Não gere scaffold automático de framework sem mostrar antes o que ele
  vai criar. Os diretórios `backend/` e `frontend/` ainda não têm projeto
  algum — o primeiro scaffold é uma decisão visível, não um efeito colateral.
- Não escreva código de funcionalidade sem uma spec correspondente que a
  defina: `docs/PRD.md` para comportamento de produto, `docs/layout.md`
  para comportamento visual. Não há pasta docs/specs/ — se a funcionalidade
  não está em nenhum dos dois, pergunte.

## Ritmo

- Não escreva código antes de um plano aprovado. Escreva o plano,
  mostre e espere.
- "Pode implementar" NÃO autoriza o plano inteiro: execute UMA tarefa,
  rode os checks (rules/checks.md), mostre o resultado e pare.
- Não relate sucesso parcial. Se um check falhou, a tarefa não terminou.

## Produção

- O fluxo deste projeto é commit e push direto na main, autorizado em
  AGENTS.md. Push na main dispara deploy na Vercel — então só dê push
  com os checks do rules/checks.md passando.
- Não rode deploy manual nem altere configuração da Vercel.
- Não toque no projeto Supabase remoto: nada de SQL, de alteração de
  schema ou de dado por lá. Tudo acontece no banco local (inclusive o
  reset de migrations do checks.md).
- Não mexa em `.env`: eles estão no `.gitignore` e contêm segredo
  (`SUPABASE_SERVICE_ROLE_KEY`).

## Precedência

- Se o código e uma spec discordarem sobre comportamento, a spec está
  certa até que alguém mude a spec (spec = PRD ou layout.md, conforme
  o tipo de comportamento).
- Se uma regra de procedimento contrariar um ADR ou uma spec, PARE e
  avise. Não escolha um dos dois por conta própria.
- "Pode ir" e "pode implementar" não revogam nada deste arquivo — nem as
  proibições já fixadas em AGENTS.md (o front nunca fala direto com o
  Supabase; nada de WebSocket ou processamento longo).
