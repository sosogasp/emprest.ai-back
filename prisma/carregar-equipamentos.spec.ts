import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { PrismaClient } from '@prisma/client'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { carregarEquipamentos } from './carregar-equipamentos'

jest.setTimeout(120000)

describe('004 — carga de equipamentos em PostgreSQL local', () => {
  let container: StartedPostgreSqlContainer
  let prisma: PrismaClient

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:15').start()
    const url = container.getConnectionUri()
    if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname)) {
      throw new Error('Os testes exigem um container no computador local')
    }
    // Infraestrutura Auth do Supabase, apenas no container descartável.
    const bootstrap = await container.exec(['psql', '-U', container.getUsername(),
      '-d', container.getDatabase(), '-v', 'ON_ERROR_STOP=1', '-c',
      `CREATE SCHEMA auth; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
       AS $$ SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid $$;`])
    if (bootstrap.exitCode !== 0) throw new Error('Falha ao preparar Auth local')
    execFileSync(process.execPath, [require.resolve('prisma/build/index.js'),
      'migrate', 'reset', '--force', '--skip-seed'], {
      env: { ...process.env, DATABASE_URL: url, DIRECT_DATABASE_URL: url },
      stdio: 'pipe',
    })
    prisma = new PrismaClient({ datasources: { db: { url } } })
  })

  afterAll(async () => {
    await prisma?.$disconnect()
    await container?.stop()
  })

  beforeEach(async () => {
    await prisma.$transaction([
      prisma.emprestimo.deleteMany(), prisma.equipamento.deleteMany(),
      prisma.membro.deleteMany(), prisma.usuario.deleteMany(), prisma.tenant.deleteMany(),
    ])
    await prisma.tenant.create({ data: { slug: 'suporte_ti', nome: 'Tenant de teste' } })
  })

  it('CA-01/02: carrega os 12 itens, duas manutenções e as imagens públicas', async () => {
    const url = container.getConnectionUri()
    const result = execFileSync(process.execPath, ['-r', require.resolve('ts-node/register'),
      join(__dirname, 'carregar-equipamentos.ts'), 'suporte_ti'], {
      env: { ...process.env, DATABASE_URL: url, DIRECT_DATABASE_URL: url },
      encoding: 'utf8',
    })
    expect(result).toContain('Carga concluída: 12 equipamentos')
    const rows = await prisma.equipamento.findMany({ orderBy: { patrimonio: 'asc' } })
    expect(rows).toHaveLength(12)
    expect(rows.filter((row) => row.manutencao).map((row) => row.patrimonio)).toEqual(['TI-0004', 'TI-0007'])
    expect(rows[9]).toMatchObject({ patrimonio: 'TI-0010', nome: 'Cabo de rede 3 m', manutencao: false })
    expect(rows.map((row) => row.categoria)).toEqual([
      'NOTEBOOK', 'NOTEBOOK', 'NOTEBOOK', 'NOTEBOOK', 'MONITOR', 'MONITOR',
      'MONITOR', 'CABO', 'CABO', 'CABO', 'CAMERA', 'CAMERA',
    ])
    for (const row of rows) {
      expect(row.imagemUrl).toBe(`https://xcqsvcqjkogrchktrmgn.supabase.co/storage/v1/object/public/equipamentos/equipamentos/${row.patrimonio}.png`)
    }
    expect(await prisma.emprestimo.count()).toBe(0)
  })

  it('CA-03: segunda execução preserva IDs e empréstimos existentes', async () => {
    await carregarEquipamentos(prisma, 'suporte_ti')
    const before = await prisma.equipamento.findMany({ orderBy: { patrimonio: 'asc' } })
    const pessoa = await prisma.usuario.create({ data: { id: randomUUID(), nome: 'Conta de teste' } })
    const loan = await prisma.emprestimo.create({ data: {
      tenantId: before[0].tenantId, equipamentoId: before[0].id, usuarioId: pessoa.id,
      retirada: new Date('2026-11-10T00:00:00Z'), prazo: new Date('2026-11-30T00:00:00Z'),
    } })
    await carregarEquipamentos(prisma, 'suporte_ti')
    const after = await prisma.equipamento.findMany({ orderBy: { patrimonio: 'asc' } })
    expect(after.map((row) => row.id)).toEqual(before.map((row) => row.id))
    expect(await prisma.emprestimo.findMany()).toEqual([loan])
  })

  it('CA-01/03: não altera equipamento de outro tenant com o mesmo patrimônio', async () => {
    const outro = await prisma.tenant.create({ data: { slug: 'outro', nome: 'Outro tenant' } })
    const sentinel = await prisma.equipamento.create({ data: {
      tenantId: outro.id, patrimonio: 'TI-0001', nome: 'Preservar', categoria: 'MONITOR',
    } })
    await carregarEquipamentos(prisma, 'suporte_ti')
    expect(await prisma.equipamento.findMany({ where: { tenantId: outro.id } })).toEqual([sentinel])
  })

  it('CA-03: duas cargas concorrentes não duplicam equipamentos', async () => {
    await Promise.all([carregarEquipamentos(prisma, 'suporte_ti'), carregarEquipamentos(prisma, 'suporte_ti')])
    expect(await prisma.equipamento.count()).toBe(12)
  })

  it('CA-03: tenant inexistente falha sem criar dados', async () => {
    await expect(carregarEquipamentos(prisma, 'inexistente')).rejects.toThrow()
    expect(await prisma.equipamento.count()).toBe(0)
    expect(await prisma.tenant.count()).toBe(1)
  })

  it('CA-01/02/03: registro antigo sem imagem mantém o ID e recebe os dados novos', async () => {
    const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug: 'suporte_ti' } })
    const antigo = await prisma.equipamento.create({ data: {
      tenantId: tenant.id, patrimonio: 'TI-0001', nome: 'Legado', categoria: 'NOTEBOOK',
    } })
    expect(antigo.imagemUrl).toBeNull()
    await carregarEquipamentos(prisma, 'suporte_ti')
    expect(await prisma.equipamento.findUniqueOrThrow({ where: { id: antigo.id } }))
      .toMatchObject({ nome: 'Notebook 14 polegadas', imagemUrl: expect.any(String) })
  })
})
