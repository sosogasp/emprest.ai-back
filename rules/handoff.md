---
description: Handoff datado de fim de implementação — onde parei, o que não funcionou e o próximo passo
globs: []
alwaysApply: true
---

# Handoff de fim de implementação
> leitor: agente

## Quando
Ao terminar a implementação de algo — uma tarefa do `tasks.md`, uma etapa do
`plan.md` ou uma fatia inteira — depois de rodar `rules/checks.md` e antes de
dizer "pronto". Vale também quando a implementação fica pela metade: o
handoff registra o estado real, inclusive o que falhou.

Um arquivo por implementação, novo a cada vez:
`docs/handoffs/AAAA-MM-DD-<assunto-curto>.md`. O `docs/` versionado é o do
repositório do front (`emprest.ai-front`) — handoff escrito na cópia de
`docs/` da raiz do workspace não é commitado em lugar nenhum.

Divergência consciente da aula 3: lá o handoff é um só, `docs/handoff.md`,
sobrescrito a cada sessão, e "entradas datadas de todas as sessões" é uma das
armadilhas. Aqui o time decidiu o contrário — cada implementação deixa o seu,
então o histórico não se perde ao sobrescrever nem morre com o chat. O resto
do espírito é o mesmo: curto, específico e sem repetir o que já está em outro
arquivo.

## Procedimento
1. Crie `docs/handoffs/AAAA-MM-DD-<assunto-curto>.md` — data do dia,
   kebab-case, sem acento (`2026-09-28-login-loja.md`). Nunca reescreva nem
   apague um handoff antigo.
2. Abra com o contexto desta implementação: a fatia
   (`docs/specs/<NNN-nome-curto>/`) e os `CA-xx` que ela atende, o commit, e
   a última linha da saída de cada check que rodou (teste, lint, typecheck,
   build). Implementação sem spec da fatia também se registra — como dívida
   de processo.
3. As cinco seções, com estes títulos e nesta ordem:
   - `## Onde parei` — duas ou três frases: o que existe e funciona, e o que
     ainda não existe.
   - `## Decisões não óbvias` — só as que ainda não viraram ADR nem rule. Se
     já está em `docs/adr/`, em `AGENTS.md` ou em `rules/`, aponte; não
     repita.
   - `## O que tentei e não funcionou` — caminhos descartados, para o próximo
     agente não tentar de novo.
   - `## Próximo passo exato` — uma ação, com nome de arquivo e etapa do
     plano. "Continuar o projeto" não é próximo passo.
   - `## Arquivos relevantes` — caminhos, não conteúdo.
4. Se um item deste handoff já apareceu no anterior, ele não é handoff:
   promova a `AGENTS.md`/`rules/` (ou proponha um ADR) e tire do arquivo novo.
5. Diga na resposta o caminho do handoff criado.

## Verificação
Existe `docs/handoffs/AAAA-MM-DD-*.md` com a data de hoje, o contexto com os
checks colados e as cinco seções preenchidas, e o passo 4 do `rules/checks.md`
mostra o arquivo novo no `git status --short`. Handoff sem "Próximo passo
exato" ou sem o resultado dos checks não conta como handoff.

## Não faça
- Não sobrescreva, apague nem "atualize" handoff de implementação anterior.
- Não carregue todos os handoffs ao retomar: leia só o mais recente (data mais
  alta no nome) e abra um antigo apenas se for citado por nome.
- Não use o handoff como fonte de verdade do produto: o que manda é a spec da
  fatia, o `docs/PRD.md`, o `docs/layout.md` e os ADRs.
- Não duplique o `AGENTS.md`, o `rules/` ou a spec dentro do handoff.
