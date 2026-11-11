import { describe, expect, it } from 'vitest'
import { createFormatters } from './format'
import { en, es } from './index'

describe('localized amounts with a dollar sign', () => {
  it('keeps catalog parity', () => expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort()))
  for (const language of ['en', 'es'] as const) {
    it(`${language} preserves dollar signs, values, percentages and UTC days`, () => {
      const f = createFormatters({ language })
      expect(f.money(1000)).toBe('$1,000.00')
      expect(f.money(-25)).toBe('-$25.00')
      expect(f.signed(75.5)).toBe('+$75.50')
      expect(f.signed(-25)).toBe('-$25.00')
      expect(f.signed(0)).toBe('$0.00')
      expect(f.signed(-0)).toBe('$0.00')
      expect(f.signed(0.001)).toBe('$0.00')
      expect(f.signed(-0.001)).toBe('$0.00')
      expect(f.symbol).toBe('$')
      expect(f.percent(0.5525)).toContain('55.25')
      expect(f.date('2024-08-29T00:00:00Z')).toContain('29')
      expect(f.date('2024-08-29T00:00:00Z')).toContain(language === 'es' ? 'ago' : 'Aug')
    })
  }
})
