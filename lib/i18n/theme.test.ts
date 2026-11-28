import { describe, expect, it } from 'vitest'
import { savePreference } from './cookie'
import { cookieNames, defaultTheme, validateTheme } from './preferences'

function jar(accepts = true) {
  let stored = ''
  return {
    get cookie() {
      return stored
    },
    set cookie(value: string) {
      if (accepts) stored = value.split(';')[0]
    },
  }
}

describe('theme boundary', () => {
  it('accepts only supported themes and falls back to dark for legacy cookies', () => {
    for (const value of ['light', 'dark']) expect(validateTheme(value)).toBe(value)
    for (const value of [undefined, '', 'overworld', 'nether', 'diamond', 'green', '<bad>', 'es']) expect(validateTheme(value)).toBe(defaultTheme)
    expect(defaultTheme).toBe('dark')
  })

  it('stores a supported theme in its own cookie', () => {
    const doc = jar()
    savePreference(doc, 'light', false, 'theme')
    expect(doc.cookie).toBe(`${cookieNames.theme}=light`)
  })

  it('rejects unsupported theme values and values from another preference', () => {
    expect(() => savePreference(jar(), 'green', false, 'theme')).toThrow('Unsupported preference')
    expect(() => savePreference(jar(), 'es', false, 'theme')).toThrow('Unsupported preference')
    expect(() => savePreference(jar(), 'dark', false)).toThrow('Unsupported preference')
  })

  it('reports a rejected cookie', () => {
    expect(() => savePreference(jar(false), 'dark', false, 'theme')).toThrow('Cookie rejected')
  })
})
