import 'reflect-metadata'
import type { IncomingMessage, ServerResponse } from 'node:http'
import configure from '@vendia/serverless-express'
import { criarApp } from '../dist/bootstrap'
import { z } from 'zod'

interface Evento { method: string; path: string; headers: IncomingMessage['headers']; body: Buffer; remoteAddress?: string }
interface Resposta { statusCode: number; headers: Record<string, string | string[]>; body: string; isBase64Encoded: boolean }
const respostaSchema = z.object({ statusCode: z.number(), headers: z.record(z.string(), z.union([z.string(), z.number(), z.array(z.string())])), body: z.string(), isBase64Encoded: z.boolean() })

async function iniciar() {
  const app = await criarApp()
  await app.init()
  return configure<Evento, Resposta>({
    app: app.getHttpAdapter().getInstance(),
    eventSourceName: 'VERCEL',
    eventSource: {
      getRequest: ({ event }: { event: Evento }) => event,
      getResponse: (response: Resposta) => response,
    },
    logSettings: { level: 'error' },
  })
}
let inicializacao: ReturnType<typeof iniciar> | undefined

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  try {
    inicializacao ??= iniciar().catch((error: unknown) => { inicializacao = undefined; throw error })
    const app = await inicializacao
    const chunks: Buffer[] = []
    if (req.body !== undefined) chunks.push(Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body)))
    else for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    const response = respostaSchema.parse(await app({ method: req.method ?? 'GET', path: req.url ?? '/', headers: req.headers, body: Buffer.concat(chunks), remoteAddress: req.socket.remoteAddress }, { callbackWaitsForEmptyEventLoop: false, functionName: 'emprest-ai-back', functionVersion: '1', invokedFunctionArn: '', memoryLimitInMB: '1024', awsRequestId: '', logGroupName: '', logStreamName: '', getRemainingTimeInMillis: () => 60000, done: () => undefined, fail: () => undefined, succeed: () => undefined }, () => undefined))
    res.statusCode = response.statusCode
    for (const [key, value] of Object.entries(response.headers)) if (key.toLowerCase() !== 'transfer-encoding') res.setHeader(key, value)
    res.end(Buffer.from(response.body, response.isBase64Encoded ? 'base64' : 'utf8'))
  } catch (error) {
    if (error instanceof z.ZodError) console.error('Resposta inválida no adaptador', error.issues.map((issue) => ({ path: issue.path, code: issue.code })))
    else console.error('Falha ao iniciar API', error instanceof Error ? error.name : 'Erro desconhecido')
    res.statusCode = 503
    res.setHeader('Content-Type', 'application/problem+json')
    res.end(JSON.stringify({ type: 'about:blank', title: 'Serviço indisponível', status: 503, detail: 'Tente novamente em instantes.' }))
  }
}
