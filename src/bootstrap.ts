import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { cleanupOpenApiDoc, ZodValidationPipe } from 'nestjs-zod'
import { z } from 'zod'
import { AppModule } from './app.module'
import { Problemas } from './problemas'
import { configurarConexoes } from './conexao'

export async function criarApp() {
  configurarConexoes()
  z.object({ SUPABASE_URL: z.url(), DATABASE_URL: z.string().min(1) }).parse(process.env)
  const app = await NestFactory.create(AppModule, { logger: false })
  app.setGlobalPrefix('v1')
  app.enableCors({ origin: ['https://emprest-ai-front.vercel.app', ...(process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173', 'http://localhost:4173'])], credentials: true })
  app.useGlobalPipes(new ZodValidationPipe())
  app.useGlobalFilters(new Problemas())
  return app
}

export function contrato(app: Awaited<ReturnType<typeof criarApp>>) {
  return cleanupOpenApiDoc(SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('EMPREST.AI').setVersion('1.0').addBearerAuth().build()), { version: '3.0' })
}
