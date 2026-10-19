import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Categoria, Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { Contexto } from '../acesso/contexto'
import { CriarEquipamentoDto } from './dtos'

const CATEGORIAS = { Notebook: Categoria.NOTEBOOK, Monitor: Categoria.MONITOR, Cabo: Categoria.CABO, 'Câmera': Categoria.CAMERA, 'Acessório': Categoria.ACESSORIO }
const ROTULOS = { NOTEBOOK: 'Notebook', MONITOR: 'Monitor', CABO: 'Cabo', CAMERA: 'Câmera', ACESSORIO: 'Acessório' } as const
const comPessoa = { usuario: true } as const
type Loan = Prisma.EmprestimoGetPayload<{ include: typeof comPessoa }>
const comEmprestimo = { emprestimos: { where: { status: 'ABERTO' as const }, include: comPessoa } }
type Item = Prisma.EquipamentoGetPayload<{ include: typeof comEmprestimo }>

export interface EstadoSolicitacao {
  manutencao: boolean
  emprestado: boolean
  prazos: Date[]
}

function iniciais(nome: string) {
  return nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}
function emprestimoDto(l: Loan) {
  return { id: l.id, equipamentoId: l.equipamentoId, pessoaId: l.usuarioId, retirada: l.retirada.toISOString().slice(0, 10), prazo: l.prazo.toISOString().slice(0, 10), pessoa: { id: l.usuario.id, nome: l.usuario.nome, iniciais: iniciais(l.usuario.nome) } }
}
function equipamentoDto(e: Item) {
  return { id: e.id, nome: e.nome, categoria: ROTULOS[e.categoria], patrimonio: e.patrimonio, manutencao: e.manutencao, observacao: e.observacao, emprestimo: e.emprestimos[0] ? emprestimoDto(e.emprestimos[0]) : null }
}

@Injectable()
export class CatalogoRepository {
  constructor(private readonly prisma: PrismaService, private readonly contexto: Contexto) {}

  async equipamentos(cursor?: string) {
    const { tenantId } = this.contexto.atual()
    const rows = await this.prisma.equipamento.findMany({ where: { tenantId }, include: comEmprestimo, orderBy: { id: 'asc' }, take: 101, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) })
    const page = rows.slice(0, 100)
    return { itens: page.map(equipamentoDto), proximoCursor: rows.length > 100 ? page[99].id : null }
  }

  async emprestimos(cursor?: string) {
    const { userId, tenantId, papel } = this.contexto.atual()
    const rows = await this.prisma.emprestimo.findMany({ where: { tenantId, status: 'ABERTO', ...(papel === 'OPERACOES' ? {} : { usuarioId: userId }) }, include: comPessoa, orderBy: { id: 'asc' }, take: 101, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) })
    const page = rows.slice(0, 100)
    return { itens: page.map(emprestimoDto), proximoCursor: rows.length > 100 ? page[99].id : null }
  }

  async cadastrar(dto: CriarEquipamentoDto) {
    const { tenantId } = this.contexto.atual()
    const item = await this.prisma.equipamento.create({ data: { ...dto, tenantId, categoria: CATEGORIAS[dto.categoria] }, include: comEmprestimo })
    return equipamentoDto(item)
  }

  async solicitar(equipamentoId: string, retirada: Date, prazo: Date, validar: (estado: EstadoSolicitacao) => void) {
    const { userId, tenantId } = this.contexto.atual()
    return this.prisma.$transaction(async (tx) => {
      // Serializa mutações deste tenant para evitar duas retiradas do mesmo item
      // ou ultrapassar o limite com requisições concorrentes.
      await tx.$queryRaw(Prisma.sql`SELECT id FROM tenants WHERE id = ${tenantId}::uuid FOR UPDATE`)
      const equipamento = await tx.equipamento.findFirst({ where: { id: equipamentoId, tenantId }, include: comEmprestimo })
      if (!equipamento) throw new NotFoundException('Equipamento não encontrado')
      const meus = await tx.emprestimo.findMany({ where: { tenantId, usuarioId: userId, status: 'ABERTO' }, select: { prazo: true } })
      validar({ manutencao: equipamento.manutencao, emprestado: equipamento.emprestimos.length > 0, prazos: meus.map((l) => l.prazo) })
      const registro = await tx.emprestimo.create({ data: { tenantId, usuarioId: userId, equipamentoId, retirada, prazo }, include: comPessoa })
      return emprestimoDto(registro)
    }, { timeout: 10000 })
  }

  async devolver(id: string) {
    const { userId, tenantId, papel } = this.contexto.atual()
    const where = { id, tenantId, ...(papel === 'OPERACOES' ? {} : { usuarioId: userId }) }
    const resultado = await this.prisma.emprestimo.updateMany({ where: { ...where, status: 'ABERTO' }, data: { status: 'DEVOLVIDO', devolvidoEm: new Date() } })
    const registro = await this.prisma.emprestimo.findFirst({ where, include: comPessoa })
    if (!registro) throw new NotFoundException('Empréstimo não encontrado')
    if (!resultado.count && registro.status !== 'DEVOLVIDO') throw new ConflictException('Não foi possível devolver')
    return emprestimoDto(registro)
  }
}
