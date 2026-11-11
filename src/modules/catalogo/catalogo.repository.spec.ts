import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { PrismaService } from '../../prisma/prisma.service'
import { Contexto, type Identidade } from '../acesso/contexto'
import { CatalogoRepository } from './catalogo.repository'
import { validarSolicitacao } from './catalogo.service'
import { equipamentoSchema } from './dtos'

jest.setTimeout(120000)

describe('005 — catálogo e empréstimos em PostgreSQL real', () => {
  let container: StartedPostgreSqlContainer
  let prisma: PrismaService
  const contexto = new Contexto()
  let repository: CatalogoRepository
  let pessoa: Identidade
  let colega: Identidade
  let outroTenant: string
  let itens: string[]
  const retirada = new Date('2026-11-06T00:00:00Z')
  const prazo = new Date('2026-11-26T00:00:00Z')

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:15').start()
    const url = container.getConnectionUri()
    if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname)) throw new Error('Banco local obrigatório')
    const bootstrap = await container.exec(['psql', '-U', container.getUsername(), '-d', container.getDatabase(),
      '-v', 'ON_ERROR_STOP=1', '-c', 'CREATE SCHEMA auth; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;'])
    if (bootstrap.exitCode !== 0) throw new Error('Auth local indisponível')
    execFileSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'reset', '--force', '--skip-seed'], {
      env: { ...process.env, DATABASE_URL: url, DIRECT_DATABASE_URL: url }, stdio: 'pipe',
    })
    prisma = new PrismaService({ datasources: { db: { url } } })
    repository = new CatalogoRepository(prisma, contexto)
  })

  afterAll(async () => { await prisma?.$disconnect(); await container?.stop() })

  beforeEach(async () => {
    await prisma.$transaction([prisma.emprestimo.deleteMany(), prisma.equipamento.deleteMany(),
      prisma.membro.deleteMany(), prisma.usuario.deleteMany(), prisma.tenant.deleteMany()])
    const tenantId = randomUUID()
    outroTenant = randomUUID()
    pessoa = { userId: randomUUID(), tenantId, nome: 'Pessoa de teste', papel: 'COLABORADOR' }
    colega = { ...pessoa, userId: randomUUID(), nome: 'Colega de teste' }
    await prisma.tenant.createMany({ data: [{ id: tenantId, slug: 'a', nome: 'A' }, { id: outroTenant, slug: 'b', nome: 'B' }] })
    await prisma.usuario.createMany({ data: [{ id: pessoa.userId, nome: pessoa.nome }, { id: colega.userId, nome: colega.nome }] })
    itens = Array.from({ length: 5 }, () => randomUUID())
    await prisma.equipamento.createMany({ data: itens.map((id, i) => ({ id,
      tenantId: i === 4 ? outroTenant : tenantId, patrimonio: `TESTE-${i}`, nome: 'Notebook de teste',
      categoria: 'NOTEBOOK', imagemUrl: i === 0 ? 'https://example.invalid/foto.png' : null })) })
  })

  function solicitar(identidade: Identidade, id: string) {
    return contexto.executar(identidade, () => repository.solicitar(id, retirada, prazo,
      (estado) => validarSolicitacao(estado, retirada)))
  }

  it('CA-01: a API recebe foto e null legado apenas do tenant correto', async () => {
    const pagina = await contexto.executar(pessoa, () => repository.equipamentos())
    expect(pagina.itens).toHaveLength(4)
    const comFoto = pagina.itens.find((item) => item.id === itens[0])
    expect(equipamentoSchema.parse(comFoto).imagemUrl).toBe('https://example.invalid/foto.png')
    expect(pagina.itens.find((item) => item.id === itens[1])?.imagemUrl).toBeNull()
    expect(pagina.itens.some((item) => item.id === itens[4])).toBe(false)
  })

  it('CA-02/04: duas solicitações ao mesmo item criam somente um empréstimo', async () => {
    const resultado = await Promise.allSettled([solicitar(pessoa, itens[0]), solicitar(colega, itens[0])])
    expect(resultado.filter((item) => item.status === 'fulfilled')).toHaveLength(1)
    expect(resultado.filter((item) => item.status === 'rejected')).toHaveLength(1)
    const loans = await prisma.emprestimo.findMany()
    expect(loans).toHaveLength(1)
    expect(loans[0]).toMatchObject({ equipamentoId: itens[0], prazo, status: 'ABERTO' })
    const pagina = await contexto.executar(pessoa, () => repository.equipamentos())
    expect(pagina.itens.find((item) => item.id === itens[0])?.emprestimo).not.toBeNull()
  })

  it('CA-03: pedidos concorrentes a itens diferentes respeitam o limite de três', async () => {
    await solicitar(pessoa, itens[0])
    await solicitar(pessoa, itens[1])
    const resultado = await Promise.allSettled([solicitar(pessoa, itens[2]), solicitar(pessoa, itens[3])])
    expect(resultado.filter((item) => item.status === 'fulfilled')).toHaveLength(1)
    expect(await prisma.emprestimo.count({ where: { usuarioId: pessoa.userId } })).toBe(3)
  })

  it('CA-05: lista apenas os empréstimos do colaborador e do seu tenant', async () => {
    await solicitar(pessoa, itens[0])
    await solicitar(colega, itens[1])
    const pagina = await contexto.executar(pessoa, () => repository.emprestimos())
    expect(pagina.itens).toHaveLength(1)
    expect(pagina.itens[0].pessoaId).toBe(pessoa.userId)
    const externa = await contexto.executar({ ...pessoa, tenantId: outroTenant }, () => repository.emprestimos())
    expect(externa.itens).toEqual([])
  })
})
