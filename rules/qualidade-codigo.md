---
description: Padrão de código — SOLID aplicado a React (front) e NestJS (back)
globs: []
alwaysApply: true
---

# Qualidade de código (SOLID)
> leitor: agente

## Quando
Ao escrever ou alterar qualquer arquivo de código (`frontend/src/`,
`backend/src/`). Vale para código novo e para código que você está movendo:
mover sem melhorar é permitido; melhorar fora do escopo da tarefa não é
(`rules/restrictions.md`).

## O princípio por trás dos cinco
Um arquivo, uma função e um componente têm **um** motivo para mudar. Os cinco
nomes do SOLID são consequências disso — quando dois deles parecerem se
contradizer, decida pelo motivo único.

## Procedimento
1. Antes de escrever, diga em uma frase qual é a responsabilidade do arquivo
   novo. "Faz a tela do catálogo" descreve uma; "busca, filtra, calcula
   situação, decide o rótulo do botão e desenha" descreve cinco.
2. **S — responsabilidade única.** Regra de negócio não mora em componente.
   Limite de 3 itens, prazo de 14 dias, atraso bloqueia, manutenção não é
   disponível: isso vive num módulo sem React — hoje `src/data/demo.ts`
   (`situacaoDoEquipamento`, `emprestimosDe`, `temAtraso`), depois no hook do
   cliente gerado. Exemplos de arquivo no tamanho certo: `src/lib/format.ts`
   (só data), `src/store/auth.ts` (só sessão), `src/components/Pill.tsx` (só
   traduz estado em cor e rótulo). `src/pages/Catalogo.tsx` acumula busca,
   filtro, situação, rótulo, linha de detalhe e layout: quando uma tarefa
   tocar numa dessas partes, extraia **só** ela — extração sem `CA` é dívida
   registrada na seção "Dívida de processo" da spec, não refatoração
   silenciosa.
3. **O — aberto para extensão, fechado para modificação.** Varie por dado, não
   por `if` novo. `Pill` é o padrão da casa: estado novo é linha nova em
   `CLASSE` e `ROTULO`, sem tocar no corpo do componente. Caso novo de estado
   ou `enum` que exija `if`/`else` no corpo do componente está errado. Na
   terceira repetição do mesmo `if`, no mesmo lugar, extraia (regra de três).
4. **L — contrato respeitado.** Quem usa um componente não precisa saber de
   regra interna dele. `Modal` fecha por Esc e por clique fora, não fecha no
   clique interno e renderiza por `createPortal`: quem envolve `Modal` não
   pode remover isso nem reimplementar por fora. Prop opcional tem default
   real (`corpo?`), nunca "opcional que quebra se vier".
5. **I — interface mínima.** Componente não recebe prop que não usa, e função
   não recebe objeto grande para usar dois campos. Passar os cinco campos para
   `cadastrar` em `src/data/demo.ts` é o limite aceitável num caso único; a
   partir do segundo uso, o objeto ganha nome próprio (tipo exportado). No
   backend, um DTO por caso de uso, não a entidade inteira.
6. **D — depender da abstração, não da implementação.** A direção da
   dependência é a prova: `src/pages` → `src/components` / `src/store` /
   `src/data` → `src/lib`. `src/lib/` não importa de `pages`, `components`,
   `store` nem `data`. Nenhum componente chama `fetch`, `axios` ou URL de API:
   `src/lib/supabase.ts` é o único lugar do front que cria o client do
   Supabase, e `Login.tsx` o usa só para sessão (ADR-001 §2 e §4, `AGENTS.md`);
   dado nenhum vem do Supabase direto — vem do cliente gerado (Orval) via
   TanStack Query. Ponto a conferir quando a API existir:
   `src/store/auth.ts` importa o tipo `Papel` de `src/data/demo.ts` — o tipo
   deve acompanhar o contrato gerado, não o módulo de exemplo.
7. **No backend (quando existir):** `src/modules/<dominio>/` com Controller →
   Service → Repository (ADR-001 §3). Controller só cuida de HTTP; Service tem
   a regra e não importa Prisma nem `Request`; Repository é o único lugar que
   fala com o Prisma. Autorização em CASL num lugar só, nunca espalhada em
   `if` (ADR-001 §7); `tenant_id` vem do JWT no guard, nunca do corpo
   (ADR-001 §6). O mesmo schema Zod valida a entrada e gera o OpenAPI
   (`nestjs-zod`, ADR-001 §5) — não valide a mesma coisa de novo à mão.

## Sinais de que a regra foi violada
- Arquivo de `src/pages/` passando de ~200 linhas, ou função de ~30.
- `any`, `as`, `!`, `@ts-ignore`, `eslint-disable`: silêncio no lugar de
  informação. O `!` de `useAuth((s) => s.usuario)!` em `Catalogo.tsx` e
  `MeusEmprestimos.tsx` é dívida já registrada (Tarefa 15 da fatia 002); a
  correção é uma função só (`useUsuarioAtual()`), não o `!` repetido em duas
  telas.
- A mesma derivação escrita em dois lugares. Exemplo real: a contagem de
  disponíveis de `Operacoes.tsx` repete
  `!e.manutencao && !emprestimos.some((l) => l.equipamentoId === e.id)`, que já
  é `situacaoDoEquipamento(item, emprestimos) === 'disponivel'`.
- Regra de negócio em JSX: comparação de data ou de prazo dentro de
  `src/pages/` (chamar `estaAtrasado` pode; reimplementar a comparação não).

## Verificação
- `npm run lint && npx tsc -b` sem falha (`rules/checks.md`). Quando a Tarefa 9
  instalar o Vitest (ADR-001 §8), o mesmo passo passa a incluir
  `npm run test`.
- Busca, com o resultado colado na resposta: nenhum `fetch`, `axios` ou
  `supabase` fora de `src/lib/`; nenhum `any`, `as` ou `!` novo; nenhuma
  derivação de empréstimo duplicada em `src/pages/`.
- Regra que só se testa renderizando a tela inteira provavelmente está no lugar
  errado: regra pura se testa sem React (`src/lib/` e as derivações de
  `src/data/`).

## Não faça
- Não crie abstração com uma implementação só, "porque amanhã pode precisar".
  Interface ou camada genérica entra com dois usos reais, ou porque o ADR a
  exige.
- Não crie camada que o ADR não tem: no front não existe service nem
  repository; a tela fala com hook e cliente gerado.
- Não refatore fora do escopo da tarefa (`rules/restrictions.md`): o que você
  viu e não é do escopo vira item na "Dívida de processo" da spec da fatia.
- Não copie a mesma derivação para uma terceira tela "para não mexer no
  arquivo do outro".
- Não cale o compilador nem o lint para o check passar, e não invente
  verificação: se o script não existe no `package.json`, diga que não existe.
