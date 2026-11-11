import type { Preferences } from './preferences'
export function createFormatters({ language }: Preferences) {
  const locale = language === 'es' ? 'es-MX' : 'en-US'
  const money = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const signed = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', signDisplay: 'exceptZero', minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const percent = new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const date = new Intl.DateTimeFormat(language === 'es' ? 'es-MX' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
  return { money: money.format, signed: signed.format, percent: percent.format, date: (value: Date | string) => date.format(new Date(value)), symbol: money.formatToParts(0).find(part => part.type === 'currency')!.value }
}
