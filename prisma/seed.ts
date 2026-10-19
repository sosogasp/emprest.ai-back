import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/** Seed idempotente: cria o tenant inicial `suporte_ti` (ADR-001 §5). */
async function main(): Promise<void> {
  await prisma.tenant.upsert({
    where: { slug: 'suporte_ti' },
    update: {},
    create: { slug: 'suporte_ti', nome: 'Suporte TI' },
  })
  console.log('Seed concluído: tenant suporte_ti')
}

main()
  .catch((erro) => {
    console.error(erro)
    process.exit(1)
  })
  .finally(() => {
    void prisma.$disconnect()
  })
