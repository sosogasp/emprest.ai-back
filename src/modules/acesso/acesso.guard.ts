import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { Observable } from 'rxjs'
import { Contexto, Identidade } from './contexto'
import { Token } from './token'
import { AcessoRepository } from './acesso.repository'

@Injectable()
export class AcessoGuard implements CanActivate {
  constructor(private readonly token: Token, private readonly repository: AcessoRepository) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string }; identidade?: Identidade }>()
    const authorization = request.headers.authorization
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException('Autenticação obrigatória')
    const { userId, tenantId } = await this.token.validar(authorization.slice(7))
    const membro = await this.repository.membro(userId, tenantId)
    if (!membro) throw new ForbiddenException('Usuário sem vínculo com esta área')
    request.identidade = { userId, tenantId, nome: membro.usuario.nome, papel: membro.papel }
    return true
  }
}

@Injectable()
export class ContextoInterceptor {
  constructor(private readonly contexto: Contexto) {}
  intercept(execution: ExecutionContext, next: { handle: () => Observable<unknown> }) {
    const { identidade } = execution.switchToHttp().getRequest<{ identidade: Identidade }>()
    return new Observable((subscriber) => this.contexto.executar(identidade, () => {
      const subscription = next.handle().subscribe(subscriber)
      return () => subscription.unsubscribe()
    }))
  }
}
