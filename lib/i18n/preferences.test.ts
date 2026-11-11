import { describe, expect, it } from 'vitest'
import { validatePreferences } from './preferences'

describe('language boundary', () => {
  it('accepts only supported languages and otherwise defaults to English', () => {
    expect(validatePreferences('es')).toEqual({ language: 'es' })
    for (const value of [undefined, '', 'en', 'unknown', '<bad>', 'MXN']) {
      expect(validatePreferences(value)).toEqual({ language: 'en' })
    }
  })
})
