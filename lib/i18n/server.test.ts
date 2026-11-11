import { expect, it, vi } from 'vitest'
const mock = vi.hoisted(() => ({ cookies: vi.fn() }))
vi.mock('next/headers', () => mock)
import { getI18n } from './server'

it('isolates request languages and never reads the legacy currency cookie', async () => {
  const spanish = vi.fn((key: string) => ({ value: key === 'finance-language' ? 'es' : 'MXN' }))
  const invalid = vi.fn((key: string) => ({ value: key === 'finance-language' ? 'bad' : 'MXN' }))
  mock.cookies.mockResolvedValueOnce({ get: spanish }).mockResolvedValueOnce({ get: invalid })
  const [first, second] = await Promise.all([getI18n(), getI18n()])
  expect(first.language).toBe('es')
  expect(second.language).toBe('en')
  expect(first.money(1000)).toBe('$1,000.00')
  expect(second.money(1000)).toBe('$1,000.00')
  for (const get of [spanish, invalid]) expect(get.mock.calls).toEqual([['finance-language']])
  expect(first).not.toHaveProperty('currency')
  expect(second).not.toHaveProperty('currency')
})
