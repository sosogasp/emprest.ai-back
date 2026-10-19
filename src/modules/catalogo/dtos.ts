import { createZodDto } from 'nestjs-zod'
import { z } from 'zod/v3'

export const pessoaSchema = z.object({ id: z.string().uuid(), nome: z.string(), iniciais: z.string() })
export const emprestimoSchema = z.object({ id: z.string().uuid(), equipamentoId: z.string().uuid(), pessoaId: z.string().uuid(), retirada: z.string(), prazo: z.string(), pessoa: pessoaSchema })
export const categoriaSchema = z.enum(['Notebook', 'Monitor', 'Cabo', 'Câmera', 'Acessório'])
export const equipamentoSchema = z.object({ id: z.string().uuid(), nome: z.string(), categoria: categoriaSchema, patrimonio: z.string(), manutencao: z.boolean(), observacao: z.string().nullable(), emprestimo: emprestimoSchema.nullable() })

export class PerfilDto extends createZodDto(pessoaSchema.extend({ papel: z.enum(['Colaborador', 'Operações']) })) {}
export class PaginaQuery extends createZodDto(z.object({ cursor: z.string().uuid().optional() })) {}
export class EquipamentosDto extends createZodDto(z.object({ itens: z.array(equipamentoSchema), proximoCursor: z.string().nullable() })) {}
export class EmprestimosDto extends createZodDto(z.object({ itens: z.array(emprestimoSchema), proximoCursor: z.string().nullable() })) {}
export class SolicitarDto extends createZodDto(z.object({ equipamentoId: z.string().uuid() }).strict()) {}
export class CriarEquipamentoDto extends createZodDto(z.object({ nome: z.string().trim().min(1).max(150), categoria: categoriaSchema, patrimonio: z.string().trim().min(1).max(80), manutencao: z.boolean().default(false), observacao: z.string().trim().max(500).optional() }).strict()) {}
export class EmprestimoDto extends createZodDto(emprestimoSchema) {}
export class EquipamentoDto extends createZodDto(equipamentoSchema) {}

