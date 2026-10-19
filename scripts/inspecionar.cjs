// Diagnóstico somente leitura. Nunca imprime chaves ou dados pessoais.
process.loadEnvFile('.env')
async function main() {
  const root = process.env.SUPABASE_URL.replace(/\/$/, '')
  const headers = { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` }
  for (const tabela of ['tenants', 'usuarios', 'membros', 'equipamentos', 'emprestimos']) {
    const r = await fetch(`${root}/rest/v1/${tabela}?select=id&limit=1`, { method: 'HEAD', headers: { ...headers, Prefer: 'count=exact' }, signal: AbortSignal.timeout(8000) })
    console.log(tabela, r.status, r.headers.get('content-range'))
  }
  const r = await fetch(`${root}/auth/v1/admin/users?page=1&per_page=100`, { headers, signal: AbortSignal.timeout(8000) })
  if (!r.ok) { console.log('auth', r.status); return }
  const body = await r.json()
  console.log('auth', r.status, 'usuarios', body.users?.length, 'com_tenant', body.users?.filter((u) => u.app_metadata?.tenant_id).length)
  const jwks = await fetch(`${root}/auth/v1/.well-known/jwks.json`, { signal: AbortSignal.timeout(8000) })
  const keys = await jwks.json()
  console.log('jwks', jwks.status, 'chaves', keys.keys?.length)
}
main().catch(() => { console.error('Não foi possível verificar os serviços remotos'); process.exitCode = 1 })
