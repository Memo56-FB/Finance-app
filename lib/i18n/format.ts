import type { Preferences } from './preferences'
import { formatMoney, type MoneyValue } from '@/lib/finance/money'
export function createFormatters({ language }: Preferences) {
  const locale = language === 'es' ? 'es-MX' : 'en-US'
  const percent = new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const date = new Intl.DateTimeFormat(language === 'es' ? 'es-MX' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
  return {
    money: (value: MoneyValue) => formatMoney(value, locale),
    signed: (value: MoneyValue) => formatMoney(value, locale, true),
    percent: percent.format,
    date: (value: Date | string) => date.format(new Date(value)),
    symbol: '$',
  }
}
