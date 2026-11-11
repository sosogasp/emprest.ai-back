import { somarDiasUteis } from './calendario'

describe('005 — prazo e limite aprovados', () => {
  it('CA-02: sexta-feira mais 14 dias úteis termina na quinta-feira', () => {
    expect(somarDiasUteis(new Date('2026-11-06T00:00:00Z'), 14).toISOString().slice(0, 10)).toBe('2026-11-26')
  })
  it('CA-02: início no fim de semana não conta sábado nem domingo', () => {
    expect(somarDiasUteis(new Date('2026-11-07T00:00:00Z'), 1).toISOString().slice(0, 10)).toBe('2026-11-09')
  })
})
