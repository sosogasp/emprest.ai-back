import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import handler from '../api/index'

jest.mock('../dist/bootstrap', () => ({
  criarApp: async () => ({
    init: async () => undefined,
    getHttpAdapter: () => ({
      getInstance: () => ({
        handle: (_req: IncomingMessage, res: ServerResponse) => {
          res.statusCode = 401
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ status: 401 }))
        },
      }),
    }),
  }),
}))

it('CA-08: adapta a requisição da Vercel sem socket sem acessar banco', async () => {
  const server = createServer((req, res) => {
    const socket = req.socket
    Object.defineProperty(req, 'body', { value: '' })
    Object.defineProperty(req, 'socket', { value: null, writable: true })
    void handler(req, res).finally(() => { req.socket = socket })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  try {
    const endereco = server.address()
    if (!endereco || typeof endereco === 'string') throw new Error('Servidor não iniciou')
    const resposta = await fetch(`http://127.0.0.1:${endereco.port}/v1/me`)
    expect(resposta.status).toBe(401)
    expect(await resposta.json()).toEqual({ status: 401 })
  } finally {
    await new Promise<void>((resolve, reject) => server.close((erro) => erro ? reject(erro) : resolve()))
  }
})
