---
description: Onde cada variável de ambiente vive e qual chave usar
globs: ["**/.env*", "frontend/src/lib/**", "backend/src/config/**"]
alwaysApply: false
---

# Variáveis de ambiente e chaves
> leitor: agente

## Quando
Ao criar ou usar qualquer variável de ambiente, ao instanciar o client
do Supabase ou o client da API, ou ao escrever código que lê
configuração.

## Inventário atual (de ARQUITETURA.md)

| Arquivo | Variável | Natureza |
|---|---|---|
| `backend/.env` | `SUPABASE_URL` | público |
| `backend/.env` | `SUPABASE_SERVICE_ROLE_KEY` | **secreto** |
| `backend/.env` | `DATABASE_URL` | secreto (pooler) |
| `backend/.env` | `DIRECT_DATABASE_URL` | secreto (migrations) |
| `frontend/.env` | `VITE_SUPABASE_URL` | público |
| `frontend/.env` | `VITE_SUPABASE_ANON_KEY` | público |
| `frontend/.env` | `VITE_API_URL` | público |

## Procedimento
1. Chave pública (anon): só ela pode aparecer em código que roda no
   navegador. A proteção dela são as políticas de acesso do banco (RLS).
   Neste projeto o front usa a anon key apenas para a sessão
   (supabase-js) — dados nunca vêm do Supabase direto no navegador.
2. Chave de serviço (service_role): ignora todas as políticas. Só no
   backend, nunca em código do `frontend/`, nunca em variável com
   prefixo `VITE_` — tudo com `VITE_` vai embutido no bundle e chega
   ao navegador.
3. Variável nova existe em TRÊS lugares ou em nenhum:
   `.env` do repositório correspondente (sua máquina) ·
   `.env.example` do mesmo repositório (versionado, sem valor) ·
   painel da Vercel, no projeto daquele repositório (preview e
   production — são dois projetos, um por repositório).
   Se o `.env.example` ainda não existir no scaffold, criá-lo faz
   parte da tarefa.
4. Ao criar uma variável, diga na resposta em quais dos três lugares
   você já a colocou e o que falta eu fazer à mão (o painel da Vercel
   sempre é manual).

## Verificação
Uma busca por `SERVICE_ROLE` no `frontend/` não retorna nada, e nenhum
valor de chave aparece em arquivo versionado. `.env.example` de cada
repositório tem todas as chaves que o projeto usa, sem nenhum valor real.

## Não faça
- Não escreva valor de chave em resposta, commit, log ou comentário.
- Não crie variável só no `.env` local. Ela quebra o deploy e o erro
  só aparece no build da Vercel.
- Não contorne uma política de acesso trocando de chave. Se a política
  atrapalha, a política está errada — pare e me avise.
