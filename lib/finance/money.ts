export type MoneyValue = string | number

export function cents(value: MoneyValue): bigint {
  const text = typeof value === 'number' ? value.toFixed(2) : value
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(text)) throw new Error('Invalid monetary value')
  const [whole, fraction = ''] = text.replace('-', '').split('.')
  const amount = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'))
  return text.startsWith('-') ? -amount : amount
}
export function decimal(value: bigint) {
  const magnitude = value < 0n ? -value : value
  return `${value < 0n ? '-' : ''}${magnitude / 100n}.${String(magnitude % 100n).padStart(2, '0')}`
}
export function validAmount(value: string, signed = false) {
  return (signed ? /^-?(?:0|[1-9]\d{0,16})(?:\.\d{1,2})?$/ : /^(?:0|[1-9]\d{0,16})(?:\.\d{1,2})?$/).test(value) && cents(value) !== 0n
}
export function moneyRatio(value: MoneyValue, total: MoneyValue) {
  const numerator = cents(value), denominator = cents(total)
  if (denominator <= 0n || numerator <= 0n) return 0
  return Number(numerator >= denominator ? 10000n : numerator * 10000n / denominator) / 100
}
export function formatMoney(value: MoneyValue, locale: string, signed = false) {
  if (typeof value === 'number') {
    return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2, ...(signed ? { signDisplay: 'exceptZero' as const } : {}) }).format(value).replace(/^[+-]?/, sign => `${sign}$`)
  }
  const amount = cents(value), magnitude = amount < 0n ? -amount : amount
  const whole = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(magnitude / 100n)
  const separator = new Intl.NumberFormat(locale).formatToParts(1.1).find(p => p.type === 'decimal')!.value
  return `${amount < 0n ? '-' : signed && amount > 0n ? '+' : ''}$${whole}${separator}${String(magnitude % 100n).padStart(2, '0')}`
}
