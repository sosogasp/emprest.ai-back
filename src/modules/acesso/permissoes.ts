import { AbilityBuilder, createMongoAbility } from '@casl/ability'
import type { Identidade } from './contexto'

/** Única matriz de ações por papel; o repositório sempre restringe o tenant. */
export function permissoes(identidade: Identidade) {
  const { can, build } = new AbilityBuilder(createMongoAbility)
  can('read', 'Equipamento')
  can('create', 'Emprestimo')
  can('read', 'Emprestimo', { usuarioId: identidade.userId, tenantId: identidade.tenantId })
  can('return', 'Emprestimo', { usuarioId: identidade.userId, tenantId: identidade.tenantId })
  if (identidade.papel === 'OPERACOES') {
    can('manage', 'Equipamento')
    can('manage', 'Emprestimo', { tenantId: identidade.tenantId })
  }
  return build()
}
