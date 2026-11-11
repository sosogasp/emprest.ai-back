// Usa somente as credenciais jÃ¡ presentes no ambiente da Vercel.
const { spawnSync } = require('node:child_process')
const etapas = [
  ['node_modules/prisma/build/index.js', 'generate'],
  ['node_modules/@nestjs/cli/bin/nest.js', 'build'],
]
for (const args of etapas) {
  const r = spawnSync(process.execPath, args, { env: process.env, stdio: 'inherit' })
  if (r.status !== 0) process.exit(r.status || 1)
}
