import { validarSolicitacao } from './catalogo.service'

const retirada = new Date('2026-11-10T00:00:00Z')
const prazo = new Date('2026-11-30T00:00:00Z')

it('005 CA-03: segue o PRD com três empréstimos, recusando o quarto', () => {
  expect(() => validarSolicitacao({ manutencao: false, emprestado: false, prazos: [prazo, prazo] }, retirada)).not.toThrow()
  expect(() => validarSolicitacao({ manutencao: false, emprestado: false, prazos: [prazo, prazo, prazo] }, retirada)).toThrow('Limite de 3')
})

it('005 CA-01/03: recusa atraso, manutenção e equipamento emprestado', () => {
  expect(() => validarSolicitacao({ manutencao: true, emprestado: false, prazos: [] }, retirada)).toThrow('manutenção')
  expect(() => validarSolicitacao({ manutencao: false, emprestado: true, prazos: [] }, retirada)).toThrow('emprestado')
  expect(() => validarSolicitacao({ manutencao: false, emprestado: false, prazos: [new Date('2026-11-09T00:00:00Z')] }, retirada)).toThrow('atraso')
})
