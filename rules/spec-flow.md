---
description: O ciclo spec → plano → tarefas de qualquer funcionalidade nova
globs: []
alwaysApply: true
---

# Abrir funcionalidade nova
> leitor: agente

## Quando
Ao iniciar qualquer funcionalidade nova do PRD, ou ao mexer numa
funcionalidade que ainda não tem spec. Vale para as duas pontas: a tela no
`frontend/` e o endpoint no `backend/`.

O `docs/` versionado é o do repositório do front (`emprest.ai-front`):
`frontend/docs/specs/<NNN-nome-curto>/`. Da raiz do workspace use esse
caminho; dentro do repositório do front ele é `docs/specs/<NNN-nome-curto>/`.
Spec escrita fora dele (por exemplo na cópia de `docs/` da raiz do
workspace) não é commitada em lugar nenhum e o `git status` do checks.md
não a vê.

## Procedimento
0. **Uma branch por spec.** Antes de implementar, crie ou retome a branch
   `spec/<NNN-nome-curto>` a partir da `main` atualizada. Toda implementação,
   teste e documentação da spec ficam nessa branch. Se a spec tocar os dois
   repositórios, use a mesma branch nos dois. Só integre na `main` por merge,
   depois de todos os checks passarem e o handoff estar registrado. Não commite
   código da spec diretamente na `main`. Esta orientação substitui o fluxo
   anterior de commit direto na principal; o push da `main` após o merge
   continua sendo o caminho de deploy na Vercel.
1. Crie `docs/specs/<NNN-nome-curto>/` — três dígitos, nome curto em
   kebab-case, na ordem do PRD (`001-login`, `002-catalogo`, ...). Sem
   pasta de spec fora desse padrão.
2. `spec.md` primeiro, com os seis títulos, sempre nesta ordem: Objetivo,
   Vínculo, Regras, Critérios de aceitação, Fora de escopo. Quando a fatia
   tocar código, acrescente Contrato afetado, Dívida de processo e Como sei
   que funcionou.
   Critério de aceitação é numerado `CA-01`, `CA-02`… e é observável de
   fora — "funciona bem" não é critério. O Vínculo cita o item numerado do
   `docs/PRD.md` (itens 1–5 da v1), a seção do `docs/layout.md` (5.x, 6,
   7.x) e o ADR-001 que restringe a fatia.
3. Antes de escrever a spec, liste as perguntas que o PRD e o layout não
   respondem. Elas ficam escritas na própria spec ("Fora de escopo / não
   decidido") e você ESPERA. Não preencha silêncio com suposição: na spec
   001 a origem de `nome` e `papel` foi deduzida do e-mail e virou a Q1 —
   exatamente o que este passo existe para evitar.
4. `plan.md` sai da spec e cita os ADRs que a restringem: etapas em ordem,
   cada uma com objetivo, arquivos que nascem ou mudam e a verificação.
5. `tasks.md` sai do plano. Cada tarefa cita o `CA-xx` que atende e cabe num
   commit. `[ ]` pendente, `[x]` feito com a evidência (o commit, o check).
6. Uma tarefa por vez: execute, rode o `rules/checks.md`, gere o handoff
   datado (`rules/handoff.md`), mostre o resultado e pare. "Pode implementar"
   não libera o plano inteiro.
7. Se o código e a spec discordarem, quem manda é a spec até que alguém mude
   a spec (`rules/restrictions.md`).

## Verificação
Existem `spec.md`, `plan.md` e `tasks.md` na mesma pasta `NNN-nome-curto`, e
nenhuma tarefa do `tasks.md` está sem `CA-xx`. Nenhum arquivo de código foi
implementado diretamente na `main`: cada spec possui sua branch e chega à
principal por merge após os checks. Nenhum arquivo de código foi
criado antes de o `plan.md` existir. Funcionalidade entregue sem spec não é
tarefa concluída — é dívida, e ela se registra na seção "Dívida de processo"
da spec da fatia.

## Não faça
- Não escreva código antes do plano aprovado.
- Não crie pasta de spec fora do padrão `NNN-nome-curto` nem numere fora da
  ordem (a próxima é a seguinte à última que existe em `docs/specs/`).
- Não escreva a spec de uma tela sem citar a seção do `docs/layout.md` que a
  define, nem a de um comportamento sem citar o item do `docs/PRD.md`.
- Não trate o PRD e o layout como a spec da fatia: eles são a fonte, não o
  recorte. A spec diz o que ESTA fatia faz e como sei que funcionou.
