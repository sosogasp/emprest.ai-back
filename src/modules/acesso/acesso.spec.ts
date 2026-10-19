import { generateKeyPairSync, sign } from 'node:crypto'
import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { CatalogoModule } from '../catalogo/catalogo.module'
import { PrismaService } from '../../prisma/prisma.service'
import { Token } from './token'
import { validarSolicitacao } from '../catalogo/catalogo.service'

const userId = '11111111-1111-4111-8111-111111111111'
const tenantId = '22222222-2222-4222-8222-222222222222'
const outroTenant = '33333333-3333-4333-8333-333333333333'
const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
function jwt(tenant = tenantId, exp = Date.now() / 1000 + 300) {
  const h = Buffer.from(JSON.stringify({ alg: 'ES256', kid: 'teste' })).toString('base64url')
  const p = Buffer.from(JSON.stringify({ sub: userId, iss: 'https://teste.supabase.co/auth/v1', aud: 'authenticated', exp, app_metadata: { tenant_id: tenant } })).toString('base64url')
  return `${h}.${p}.${sign('sha256', Buffer.from(`${h}.${p}`), { key: privateKey, dsaEncoding: 'ieee-p1363' }).toString('base64url')}`
}

describe('003 — acesso real', () => {
  let app: INestApplication
  const fetchOriginal = global.fetch
  const envOriginal = process.env.SUPABASE_URL
  beforeAll(async () => {
    process.env.SUPABASE_URL = 'https://teste.supabase.co'
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ keys: [{ ...publicKey.export({ format: 'jwk' }), kid: 'teste', alg: 'ES256', use: 'sig' }] }) })
    const prisma = { membro: { findUnique: jest.fn(async (q: { where: { usuarioId_tenantId: { tenantId: string } } }) => q.where.usuarioId_tenantId.tenantId === tenantId ? { papel: 'COLABORADOR', usuario: { nome: 'Pessoa Teste' } } : null) }, equipamento: { findMany: jest.fn(async () => []) }, emprestimo: { findMany: jest.fn(async () => []) } }
    const module = await Test.createTestingModule({ imports: [CatalogoModule] }).overrideProvider(PrismaService).useValue(prisma).compile()
    app = module.createNestApplication()
    app.setGlobalPrefix('v1')
    await app.init()
  })
  afterAll(async () => {
    await app?.close()
    global.fetch = fetchOriginal
    if (envOriginal === undefined) delete process.env.SUPABASE_URL
    else process.env.SUPABASE_URL = envOriginal
  })

  const rotas = [ ['get', '/v1/me'], ['get', '/v1/equipamentos'], ['get', '/v1/emprestimos'], ['post', '/v1/equipamentos'], ['post', '/v1/emprestimos'], ['post', `/v1/emprestimos/${userId}/devolucao`] ] as const
  for (const [metodo, rota] of rotas) {
    it(`CA-02/06: ${metodo} ${rota} exige autenticação`, async () => { await request(app.getHttpServer())[metodo](rota).expect(401) })
    it(`CA-02/06: ${metodo} ${rota} rejeita tenant sem vínculo`, async () => { await request(app.getHttpServer())[metodo](rota).set('Authorization', `Bearer ${jwt(outroTenant)}`).expect(403) })
  }
  it('CA-03: perfil vem do vínculo confirmado', async () => {
    const response = await request(app.getHttpServer()).get('/v1/me').set('Authorization', `Bearer ${jwt()}`).expect(200)
    expect(response.body).toEqual({ id: userId, nome: 'Pessoa Teste', iniciais: 'PT', papel: 'Colaborador' })
  })
  it('CA-06: colaborador não cadastra equipamento', async () => { await request(app.getHttpServer()).post('/v1/equipamentos').set('Authorization', `Bearer ${jwt()}`).send({}).expect(403) })
  it('CA-02: token expirado é recusado', async () => { await expect(new Token().validar(jwt(tenantId, 1))).rejects.toThrow('Sessão inválida') })
  it('CA-02: assinatura adulterada é recusada', async () => { const token = jwt(); await expect(new Token().validar(token.slice(0, -8) + 'AAAAAAAA')).rejects.toThrow('Sessão inválida') })
  it('CA-05: bloqueia manutenção, indisponibilidade, limite e atraso', () => {
    const retirada = new Date('2026-10-19T00:00:00Z')
    const base = { manutencao: false, emprestado: false, prazos: [] }
    expect(() => validarSolicitacao({ ...base, manutencao: true }, retirada)).toThrow('manutenção')
    expect(() => validarSolicitacao({ ...base, emprestado: true }, retirada)).toThrow('emprestado')
    expect(() => validarSolicitacao({ ...base, prazos: [retirada, retirada, retirada] }, retirada)).toThrow('Limite')
    expect(() => validarSolicitacao({ ...base, prazos: [new Date('2026-10-18T00:00:00Z')] }, retirada)).toThrow('atraso')
    expect(() => validarSolicitacao({ ...base, prazos: [retirada] }, retirada)).not.toThrow()
  })
})
