import type { Preferences } from './preferences'
export function createFormatters({ language }: Preferences) {
  const locale = language === 'es' ? 'es-MX' : 'en-US'
  const number = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const signed = new Intl.NumberFormat(locale, { signDisplay: 'exceptZero', minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const percent = new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const date = new Intl.DateTimeFormat(language === 'es' ? 'es-MX' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
  return {
    money: (value: number) => number.format(value).replace(/^-?/, sign => `${sign}$`),
    signed: (value: number) => signed.format(value).replace(/^[+-]?/, sign => `${sign}$`),
    percent: percent.format,
    date: (value: Date | string) => date.format(new Date(value)),
    symbol: '$',
  }
}
