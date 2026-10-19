import { configurarConexoes } from './conexao'

describe('003 — conexão do deploy', () => {
  const original = { ...process.env }
  afterEach(() => { process.env = { ...original } })
  it('CA-08: mantém a senha e separa pooler de transação e sessão', () => {
    process.env.SUPABASE_URL = 'https://teste.supabase.co'
    process.env.DATABASE_URL = 'postgresql://postgres:senha-teste@db.teste.supabase.co:5432/postgres'
    process.env.DIRECT_DATABASE_URL = process.env.DATABASE_URL
    configurarConexoes()
    const runtime = new URL(process.env.DATABASE_URL)
    const migration = new URL(process.env.DIRECT_DATABASE_URL)
    expect(runtime.hostname).toBe('aws-0-us-west-2.pooler.supabase.com')
    expect(runtime.password).toBe('senha-teste')
    expect(runtime.username).toBe('postgres.teste')
    expect(runtime.port).toBe('6543')
    expect(runtime.searchParams.get('pgbouncer')).toBe('true')
    expect(migration.port).toBe('5432')
    expect(migration.searchParams.has('pgbouncer')).toBe(false)
  })
  it('CA-08: preserva conexões de pooler já configuradas', () => {
    process.env.SUPABASE_URL = 'https://teste.supabase.co'
    process.env.DATABASE_URL = 'postgresql://postgres:senha-teste@pooler.example.com:6543/postgres'
    const valor = process.env.DATABASE_URL
    configurarConexoes()
    expect(process.env.DATABASE_URL).toBe(valor)
  })
})
