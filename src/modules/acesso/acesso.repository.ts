import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class AcessoRepository {
  constructor(private readonly prisma: PrismaService) {}
  membro(userId: string, tenantId: string) {
    return this.prisma.membro.findUnique({
      where: { usuarioId_tenantId: { usuarioId: userId, tenantId } },
      include: { usuario: true },
    })
  }
}
