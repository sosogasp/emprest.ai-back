import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common'
import { Contexto } from '../acesso/contexto'
import { permissoes } from '../acesso/permissoes'
import { CatalogoRepository, EstadoSolicitacao } from './catalogo.repository'
import { CriarEquipamentoDto } from './dtos'

export function hoje() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

export function validarSolicitacao(estado: EstadoSolicitacao, retirada: Date) {
  if (estado.manutencao) throw new ConflictException('Equipamento em manutenção')
  if (estado.emprestado) throw new ConflictException('Equipamento já emprestado')
  if (estado.prazos.length >= 3) throw new ConflictException('Limite de 3 itens atingido')
  if (estado.prazos.some((prazo) => prazo < retirada)) throw new ConflictException('Devolva o item em atraso antes de solicitar outro')
}

@Injectable()
export class CatalogoService {
  constructor(private readonly repository: CatalogoRepository, private readonly contexto: Contexto) {}
  perfil() {
    const { userId, nome, papel } = this.contexto.atual()
    return { id: userId, nome, iniciais: nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase(), papel: papel === 'OPERACOES' ? 'Operações' as const : 'Colaborador' as const }
  }
  equipamentos(cursor?: string) { return this.repository.equipamentos(cursor) }
  emprestimos(cursor?: string) { return this.repository.emprestimos(cursor) }
  cadastrar(dto: CriarEquipamentoDto) {
    if (!permissoes(this.contexto.atual()).can('create', 'Equipamento')) throw new ForbiddenException('Somente Operações pode cadastrar equipamentos')
    return this.repository.cadastrar(dto)
  }
  solicitar(equipamentoId: string) {
    if (!permissoes(this.contexto.atual()).can('create', 'Emprestimo')) throw new ForbiddenException()
    const retirada = new Date(`${hoje()}T00:00:00.000Z`)
    const prazo = new Date(retirada)
    prazo.setUTCDate(prazo.getUTCDate() + 14)
    return this.repository.solicitar(equipamentoId, retirada, prazo, (estado) => validarSolicitacao(estado, retirada))
  }
  devolver(id: string) { return this.repository.devolver(id) }
}
