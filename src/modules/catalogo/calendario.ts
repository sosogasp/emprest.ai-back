/** Conta a partir do dia seguinte, excluindo sábados e domingos. */
export function somarDiasUteis(retirada: Date, dias: number): Date {
  const prazo = new Date(retirada)
  let contados = 0
  while (contados < dias) {
    prazo.setUTCDate(prazo.getUTCDate() + 1)
    if (prazo.getUTCDay() !== 0 && prazo.getUTCDay() !== 6) contados++
  }
  return prazo
}
