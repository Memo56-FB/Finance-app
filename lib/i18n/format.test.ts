import { describe, expect, it } from 'vitest'
import { createFormatters } from './format'
import { en, es } from './index'

describe('localized presentation with fixed USD', () => {
  it('keeps catalog parity', () => expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort()))
  for (const language of ['en', 'es'] as const) {
    it(`${language} preserves USD, values, signs, percentages and UTC days`, () => {
      const f = createFormatters({ language })
      const symbol = language === 'es' ? 'USD ' : '$'
      const normalize = (value: string) => value.replace(/\s/g, ' ')
      expect(normalize(f.money(1000))).toBe(`${symbol}1,000.00`)
      expect(normalize(f.signed(75.5))).toBe(`+${symbol}75.50`)
      expect(normalize(f.signed(-25))).toBe(`-${symbol}25.00`)
      expect(normalize(f.signed(0))).toBe(`${symbol}0.00`)
      expect(f.symbol).toBe(symbol.trim())
      expect(f.percent(0.5525)).toContain('55.25')
      expect(f.date('2024-08-29T00:00:00Z')).toContain('29')
      expect(f.date('2024-08-29T00:00:00Z')).toContain(language === 'es' ? 'ago' : 'Aug')
    })
  }
})
