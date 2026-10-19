/** Compatibiliza as URLs diretas deste projeto com o pooler IPv4 validado.
 * Credenciais permanecem no ambiente do processo; nunca são serializadas em logs.
 */
export function configurarConexoes() {
  const ref = new URL(process.env.SUPABASE_URL ?? '').hostname.split('.')[0]
  for (const nome of ['DATABASE_URL', 'DIRECT_DATABASE_URL']) {
    const valor = process.env[nome]
    if (!valor) continue
    const url = new URL(valor)
    if (url.hostname !== `db.${ref}.supabase.co`) continue
    url.hostname = 'aws-0-us-west-2.pooler.supabase.com'
    url.username = `postgres.${ref}`
    url.port = nome === 'DATABASE_URL' ? '6543' : '5432'
    url.searchParams.set('connect_timeout', '10')
    if (nome === 'DATABASE_URL') {
      url.searchParams.set('pgbouncer', 'true')
      url.searchParams.set('connection_limit', '1')
    } else url.searchParams.delete('pgbouncer')
    process.env[nome] = url.toString()
  }
}
