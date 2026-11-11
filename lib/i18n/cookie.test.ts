import { expect, it } from 'vitest'
import { savePreference } from './cookie'

it('rejects unsupported languages before writing and detects blocked cookies', () => {
  const blocked = { get cookie() { return '' }, set cookie(_value: string) {} }
  expect(() => savePreference(blocked, 'es', true)).toThrow('Cookie rejected')
  const jar = { cookie: '' }
  for (const value of ['MXN', 'USD', 'fr', 'es; Path=/other']) {
    expect(() => savePreference(jar, value, true)).toThrow('Unsupported preference')
    expect(jar.cookie).toBe('')
  }
})

it('writes only the language cookie with the site scope and HTTPS protection', () => {
  const jar = { cookie: '' }
  savePreference(jar, 'es', true)
  expect(jar.cookie).toBe('finance-language=es; Path=/; SameSite=Lax; Max-Age=31536000; Secure')
  savePreference(jar, 'en', false)
  expect(jar.cookie).toBe('finance-language=en; Path=/; SameSite=Lax; Max-Age=31536000')
})
