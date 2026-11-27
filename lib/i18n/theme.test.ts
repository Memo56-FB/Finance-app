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
  it('accepts only supported themes and otherwise uses overworld', () => {
    for (const value of ['overworld', 'nether', 'diamond']) expect(validateTheme(value)).toBe(value)
    for (const value of [undefined, '', 'Nether', 'green', '<bad>', 'es']) expect(validateTheme(value)).toBe(defaultTheme)
    expect(defaultTheme).toBe('overworld')
  })

  it('stores a supported theme in its own cookie', () => {
    const doc = jar()
    savePreference(doc, 'diamond', false, 'theme')
    expect(doc.cookie).toBe(`${cookieNames.theme}=diamond`)
  })

  it('rejects unsupported theme values and values from another preference', () => {
    expect(() => savePreference(jar(), 'green', false, 'theme')).toThrow('Unsupported preference')
    expect(() => savePreference(jar(), 'es', false, 'theme')).toThrow('Unsupported preference')
    expect(() => savePreference(jar(), 'nether', false)).toThrow('Unsupported preference')
  })

  it('reports a rejected cookie', () => {
    expect(() => savePreference(jar(false), 'nether', false, 'theme')).toThrow('Cookie rejected')
  })
})
