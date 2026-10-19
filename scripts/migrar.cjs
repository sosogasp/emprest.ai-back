// Execução explicitamente autorizada: migration existente, sem reset.
const { spawnSync } = require('node:child_process')
process.loadEnvFile('.env')
const conexao = new URL(process.env.DATABASE_URL)
if (!conexao.hostname.includes('pooler.supabase.com')) throw new Error('Pooler de sessão não configurado')
conexao.port = '5432'
conexao.searchParams.delete('pgbouncer')
conexao.searchParams.set('connect_timeout', '10')
const resultado = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { env: { ...process.env, DIRECT_DATABASE_URL: conexao.toString() }, stdio: 'inherit' })
process.exitCode = resultado.status ?? 1
