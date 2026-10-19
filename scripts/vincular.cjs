// Vincula somente a conta informada pela usuária, sem criar senha nem enviar e-mail.
const { PrismaClient } = require('@prisma/client')
if (require('node:fs').existsSync('.env')) process.loadEnvFile('.env')
async function main() {
  const email = process.argv[2] || process.env.INITIAL_OPERATOR_EMAIL
  if (!email) throw new Error('Informe o e-mail da conta já criada')
  const root = process.env.SUPABASE_URL.replace(/\/$/, '')
  const headers = { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' }
  const r = await fetch(`${root}/auth/v1/admin/users?page=1&per_page=100`, { headers })
  if (!r.ok) throw new Error('Não foi possível consultar a conta')
  const { users } = await r.json()
  const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) throw new Error('Crie a conta no painel Authentication antes de vincular')
  const prisma = new PrismaClient()
  try {
    const tenant = await prisma.tenant.upsert({ where: { slug: 'suporte_ti' }, update: {}, create: { slug: 'suporte_ti', nome: 'Suporte TI' } })
    await prisma.usuario.upsert({ where: { id: user.id }, update: { email }, create: { id: user.id, email, nome: user.user_metadata?.full_name || email.split('@')[0] } })
    await prisma.membro.upsert({ where: { usuarioId_tenantId: { usuarioId: user.id, tenantId: tenant.id } }, update: { papel: 'OPERACOES' }, create: { usuarioId: user.id, tenantId: tenant.id, papel: 'OPERACOES' } })
    const update = await fetch(`${root}/auth/v1/admin/users/${user.id}`, { method: 'PUT', headers, body: JSON.stringify({ app_metadata: { ...user.app_metadata, tenant_id: tenant.id } }) })
    if (!update.ok) throw new Error('Vínculo salvo, mas o claim de tenant não foi atualizado')
    console.log('Conta existente vinculada a Operações. Entre novamente para renovar o token.')
  } finally { await prisma.$disconnect() }
}
main().catch((error) => { console.error(error.message.startsWith('Crie') ? error.message : 'Não foi possível concluir o vínculo. Verifique conexão e tabelas.'); process.exitCode = 1 })
