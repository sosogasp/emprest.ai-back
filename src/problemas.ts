import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common'

@Catch()
export class Problemas implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<{ status: (code: number) => { type: (type: string) => { send: (body: unknown) => void } } }>()
    const request = host.switchToHttp().getRequest<{ url: string }>()
    const status = error instanceof HttpException ? error.getStatus() : 500
    const detail = error instanceof HttpException ? error.message : 'Não foi possível concluir a operação'
    response.status(status).type('application/problem+json').send({ type: 'about:blank', title: status >= 500 ? 'Serviço indisponível' : 'Solicitação recusada', status, detail, instance: request.url })
  }
}
