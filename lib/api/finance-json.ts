import { isLosslessNumber, LosslessNumber, parse, stringify } from 'lossless-json'

const ids = new Set(['id', 'categoryId', 'potId', 'recurringPaymentId', 'occurrenceId', 'budgetId'])
const amounts = new Set(['amount', 'targetAmount', 'balance', 'totalBalance', 'spendingLimit', 'spent', 'available', 'exceededAmount', 'currentBalance', 'income', 'expenses', 'totalAmount', 'paidAmount'])
const integers = new Set(['page', 'size', 'startDay', 'billingDay', 'totalInstallments', 'intervalMonths'])
const counts = new Set(['totalElements', 'totalPages', 'count', 'paidInstallments'])

export function validId(value: string) {
  return /^[1-9]\d{0,18}$/.test(value) && BigInt(value) <= 9223372036854775807n
}

// Decode before Axios or fetch can round Java Longs and BigDecimals.
export function parseFinance(text: string): unknown {
  return parse(text, (key, value) => {
    if (ids.has(key) || amounts.has(key) || counts.has(key) || integers.has(key)) {
      if (value === null && ['categoryId', 'potId', 'recurringPaymentId', 'occurrenceId', 'paidAmount', 'totalInstallments'].includes(key)) return null
      if (!isLosslessNumber(value)) throw new Error('Invalid financial number')
      const raw = value.value
      if (ids.has(key) && !validId(raw)) throw new Error('Invalid financial ID')
      if (amounts.has(key) && !/^-?\d+(?:\.\d{1,2})?$/.test(raw)) throw new Error('Invalid monetary value')
      if (counts.has(key) && !/^\d+$/.test(raw)) throw new Error('Invalid count')
      if (integers.has(key)) {
        if (!/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw)) || Number(raw) > 2147483647) throw new Error('Invalid integer')
        return Number(raw)
      }
      return raw
    }
    return isLosslessNumber(value) ? value.value : value
  })
}

export function stringifyFinance(value: unknown): string {
  const result = stringify(value, (key, item) => {
    if (item !== null && (ids.has(key) || amounts.has(key) || integers.has(key))) {
      const raw = String(item)
      if (ids.has(key) ? !validId(raw) : !/^-?\d+(?:\.\d{1,2})?$/.test(raw)) throw new Error('Invalid financial input')
      return new LosslessNumber(raw)
    }
    return item
  })
  if (result === undefined) throw new Error('Missing financial input')
  return result
}
