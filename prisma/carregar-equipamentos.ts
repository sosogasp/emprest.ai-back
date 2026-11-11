import { Categoria, PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'

const equipamentoSchema = z.object({
  patrimonio: z.string(),
  nome: z.string().min(1),
  categoria: z.enum(Categoria),
  manutencao: z.boolean(),
  imagemUrl: z.url().startsWith('https://'),
}).strict()

const loteSchema = z.array(equipamentoSchema).length(12).superRefine((itens, contexto) => {
  const patrimonios = new Set(itens.map((item) => item.patrimonio))
  for (let numero = 1; numero <= 12; numero++) {
    const patrimonio = `TI-${String(numero).padStart(4, '0')}`
    const item = itens.find((registro) => registro.patrimonio === patrimonio)
    if (!patrimonios.has(patrimonio) || item?.manutencao !== [4, 7].includes(numero)) {
      contexto.addIssue({ code: 'custom', message: `Dados iniciais inválidos para ${patrimonio}` })
    }
  }
})

/** CA-01/02/03: carga transacional por patrimônio, preservando IDs e empréstimos. */
export async function carregarEquipamentos(prisma: PrismaClient, slug: string): Promise<void> {
  if (!slug.trim()) throw new Error('Informe o slug do tenant de destino')
  const itens = loteSchema.parse(JSON.parse(readFileSync(join(__dirname, 'dados/equipamentos.json'), 'utf8')))
  await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.findUniqueOrThrow({ where: { slug } })
    // Mesmo bloqueio da solicitação: uma carga não intercala com empréstimos do tenant.
    await tx.$queryRaw`SELECT id FROM tenants WHERE id = ${tenant.id}::uuid FOR UPDATE`
    for (const item of itens) {
      await tx.equipamento.upsert({
        where: { tenantId_patrimonio: { tenantId: tenant.id, patrimonio: item.patrimonio } },
        create: { ...item, tenantId: tenant.id },
        update: item,
      })
    }
  }, { timeout: 30000 })
}

async function main(): Promise<void> {
  const slug = process.argv[2]
  if (!slug) throw new Error('Uso: npx ts-node prisma/carregar-equipamentos.ts SLUG_DO_TENANT')
  const prisma = new PrismaClient()
  try {
    await carregarEquipamentos(prisma, slug)
    console.log('Carga concluída: 12 equipamentos; nenhum empréstimo criado ou removido')
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  void main().catch(() => {
    console.error('Falha na execução da carga. Confira o tenant, a conexão e os dados antes de repetir.')
    process.exitCode = 1
  })
}
