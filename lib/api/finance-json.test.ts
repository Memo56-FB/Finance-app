import { describe, expect, it } from 'vitest'
import { parseFinance, stringifyFinance } from './finance-json'
import { cents, decimal, formatMoney, moneyRatio, validAmount } from '@/lib/finance/money'

describe('exact finance values', () => {
  it('preserves JSON amounts, IDs, totals and nullable fields without Number', () => {
    const text = '{"id":9007199254740993,"amount":99999999999999999.99,"totalBalance":199999999999999999.98,"page":0,"totalElements":9007199254740993,"categoryId":null}'
    expect(parseFinance(text)).toEqual({ id: '9007199254740993', amount: '99999999999999999.99', totalBalance: '199999999999999999.98', page: 0, totalElements: '9007199254740993', categoryId: null })
    expect(stringifyFinance({ name: '123', id: '9007199254740993', amount: '-99999999999999999.99', categoryId: null })).toBe('{"name":"123","id":9007199254740993,"amount":-99999999999999999.99,"categoryId":null}')
  })
  it('rejects malformed financial contracts', () => {
    for (const text of ['{"id":-1}', '{"id":9223372036854775808}', '{"amount":"1.00"}', '{"amount":1.001}', '{"page":0.5}', '{"totalElements":-1}', '{"intervalMonths":1.5}', '{"intervalMonths":"3"}']) expect(() => parseFinance(text)).toThrow()
  })
  it('reads and writes subscription intervals as JSON integers', () => {
    expect(parseFinance('{"intervalMonths":3}')).toEqual({intervalMonths:3})
    expect(stringifyFinance({intervalMonths:'12'})).toBe('{"intervalMonths":12}')
  })
  it('validates individual amounts without limiting aggregates', () => {
    expect(validAmount('99999999999999999.99')).toBe(true)
    expect(validAmount('-10.01', true)).toBe(true)
    for (const value of ['0', '-1', '1.001', '1e2', '1,000', '100000000000000000', ' 1', '01']) expect(validAmount(value)).toBe(false)
    expect(decimal(cents('99999999999999999.99') * 2n)).toBe('199999999999999999.98')
  })
  it('formats exact values in both languages and only converts visual ratios', () => {
    for (const locale of ['es-MX', 'en-US']) {
      expect(formatMoney('-99999999999999999.99', locale)).toBe('-$99,999,999,999,999,999.99')
      expect(formatMoney('0', locale, true)).toBe('$0.00')
      expect(formatMoney(1.25, locale, true)).toBe('+$1.25')
    }
    expect(moneyRatio('125', '100')).toBe(100)
    expect(moneyRatio('-1', '100')).toBe(0)
    expect(moneyRatio('1', '0')).toBe(0)
    expect(moneyRatio('99999999999999999.98', '99999999999999999.99')).toBe(99.99)
  })
})
