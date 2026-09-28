---
description: O que se prova com teste, com que runner e onde o teste mora
globs: []
alwaysApply: true
---

# Testes
> leitor: agente

## Quando
Sempre que você for criar ou mudar um arquivo de teste, e antes de dizer que um
`CA-xx` está atendido. Vale para as duas pontas: componente no `frontend/` e
rota no `backend/`.

Nenhum runner existe hoje nos dois repositórios: `frontend/package.json` tem
`dev`, `build`, `lint`, `typecheck` e `preview`, e a pasta `backend/` ainda não
tem `package.json` (nem `src/`). Este arquivo diz o que fazer quando o runner
existir e o que declarar enquanto não existe.

## Procedimento
1. A matriz é do ADR-001 §8 e não se escolhe outra: Jest no backend, Vitest no
   frontend, Testcontainers com Postgres real na integração de banco, supertest
   sobre a app Nest na API, Playwright no E2E. Meta de cobertura: **sem
   percentual; caminhos críticos obrigatórios**. Trocar qualquer linha dessa
   tabela é assunto de ADR, não de conversa no chat.
2. Dependência de teste é dependência nova — o runner, o ambiente de DOM e a
   biblioteca que renderiza e consulta o componente: nenhuma entra sem mostrar
   antes e esperar (`rules/restrictions.md`). **Ponto não decidido:** o
   ADR-001 §8 decide o runner (Vitest) e a Tarefa 9 da 002 diz `jsdom`, mas
   quem renderiza o componente em teste e faz as consultas
   (`@testing-library/react` é o padrão de mercado) não está em lugar nenhum.
   Instalar isso é escolher biblioteca fora do ADR — proponha ao time junto com
   o resto da Tarefa 9 e espere.
3. Prova-se com teste o `CA-xx` que só se observa com interação ou DOM:
   clique, foco, `createPortal`, toast, timer, CSS aplicado. O resto pode ser
   smoke de render — foi assim na 001 e na 002 —, porque o smoke não alcança
   chips, busca, clique do modal, toast nem animação (002, "Como sei que
   funcionou").
4. O arquivo de teste mora ao lado do que ele testa e leva o nome do testado:
   `frontend/src/pages/Catalogo.test.tsx` para `src/pages/Catalogo.tsx`. Um
   arquivo por arquivo testado; nada de pasta `__tests__` nem de teste "geral"
   da aplicação.
5. O nome do caso carrega o `CA-xx` que ele prova —
   `it('CA-13: confirmar solicita e mostra o toast')`. Caso sem CA, ou é sobra
   (prova comportamento que a spec não pediu) ou é falta (a spec está
   incompleta): nos dois casos, mostre antes de fingir que passou.
6. No backend, isolamento de tenant é teste obrigatório, um caso por endpoint:
   tenant A não enxerga dado de tenant B (ADR-001 §8). Não é item de "quando
   der tempo".
7. Nenhum teste fala com o Supabase remoto nem com banco que não seja local
   (`rules/checks.md`, `rules/secrets.md`). O dado do front é o de exemplo
   (`src/data/demo.ts`) ou fixture do próprio teste.
8. Teste que lê o relógio real quebra sozinho. O "hoje" do produto é
   `HOJE_DEMO` (`src/data/demo.ts`) até a Q4 da 002 fechar (`tasks.md`,
   Tarefa 12) — congele a data no teste em vez de chamar `new Date()` no
   caminho do produto.
9. Quando o runner entrar, três coisas mudam junto: o passo 1 do
   `rules/checks.md` passa a incluir `npm run test` no front, a Verificação do
   `rules/qualidade-codigo.md` idem, e a linha da Tarefa 9 no `tasks.md` vira
   `[x]` com a evidência. Runner instalado e regra desatualizada é dívida.

## Verificação
Pronto = cada `CA-xx` tocado pela tarefa tem caso de teste que o cita no nome,
ou a resposta diz em voz alta por que aquele CA não tem teste automatizado — "o
runner ainda não está instalado" conta, desde que dito (`rules/checks.md`).
Um caso por CA, não um teste por tela. O passo 4 do `rules/checks.md` mostra o
arquivo de teste novo no `git status --short`.

## Não faça
- Não instale runner nem biblioteca de teste sem mostrar antes e esperar.
- Não rode teste contra o Postgres do Supabase remoto.
- Não troque a matriz do ADR-001 §8 (Cypress, happy-dom, mock no lugar do
  Postgres real) sem ADR novo.
- Não escreva E2E de Playwright para o que um teste de componente prova:
  Playwright é a camada mais cara do projeto e o app é SPA (ADR-001 §2).
- Não apague, comente nem marque `skip` num teste vermelho para a tarefa
  terminar: teste vermelho é tarefa não terminada (`rules/checks.md`).
- Não trate o teste como fonte de verdade do produto — quem manda é o `CA-xx`
  da spec (`rules/restrictions.md`, "Precedência").
