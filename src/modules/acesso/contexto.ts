import { AsyncLocalStorage } from 'node:async_hooks'
import { Injectable, UnauthorizedException } from '@nestjs/common'

export interface Identidade {
  userId: string
  tenantId: string
  nome: string
  papel: 'COLABORADOR' | 'OPERACOES'
}

@Injectable()
export class Contexto {
  private readonly local = new AsyncLocalStorage<Identidade>()
  executar<T>(identidade: Identidade, acao: () => T): T {
    return this.local.run(identidade, acao)
  }
  atual(): Identidade {
    const identidade = this.local.getStore()
    if (!identidade) throw new UnauthorizedException('Sessão ausente')
    return identidade
  }
}
