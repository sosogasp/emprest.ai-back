// Usa somente as credenciais já presentes no ambiente da Vercel.
require('ts-node/register')
const { spawnSync } = require('node:child_process')
const { configurarConexoes } = require('../src/conexao')
configurarConexoes()
const etapas = [
  ['node_modules/prisma/build/index.js', 'generate'],
  ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
  ['-r', 'ts-node/register', 'prisma/seed.ts'],
  ['scripts/provisionar.cjs'],
  ['node_modules/@nestjs/cli/bin/nest.js', 'build'],
]
for (const args of etapas) {
  const r = spawnSync(process.execPath, args, { env: process.env, stdio: 'inherit' })
  if (r.status !== 0) process.exit(r.status || 1)
}
