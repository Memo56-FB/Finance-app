import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '@/app/api/finance/[...path]/route'
import { financePath } from './finance-path'

afterEach(() => vi.unstubAllGlobals())
function request(path: string, method = 'GET', options: { cookie?: string; origin?: string; token?: string; body?: string } = {}) {
  const headers: Record<string, string> = { Cookie: options.cookie ?? 'JSESSIONID=test', Origin: options.origin ?? 'http://localhost:3000', 'Content-Type': 'application/json' }
  if (options.token) headers['X-CSRF-TOKEN'] = options.token
  return new NextRequest('http://localhost:3000/api/finance/' + path, { method, headers, ...(options.body ? { body: options.body } : {}) })
}
const context = (path: string) => ({ params: Promise.resolve({ path: path.split('?')[0].split('/') }) })

describe('closed finance forwarding', () => {
  it('validates paths, methods and parameters before contacting Spring', () => {
    for (const [path, method, status] of [['auth/login','POST',404],['transactions/1','POST',405],['transactions?categoryId=0','GET',400],['transactions?page=2147483648','GET',400],['transactions?size=0','GET',400],['budgets?month=2027-13','GET',400],['transactions?evil=x','GET',400],['transactions?size=1&size=2','GET',400]] as const) {
      const [route, query] = path.split('?')
      expect(financePath(route.split('/'), new URLSearchParams(query), method).status).toBe(status)
    }
    expect(financePath(['transactions'], new URLSearchParams('categoryId=9007199254740993'), 'GET').status).toBe(200)
  })
  it('rejects anonymous, guest, cross-origin and missing CSRF requests', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch)
    expect((await GET(request('categories','GET',{cookie:''}),context('categories'))).status).toBe(401)
    expect((await GET(request('categories','GET',{cookie:'JSESSIONID=test; finance-guest=1'}),context('categories'))).status).toBe(401)
    expect((await POST(request('categories','POST',{token:'t',origin:'https://evil.test'}),context('categories'))).status).toBe(403)
    expect((await DELETE(request('categories/1','DELETE'),context('categories/1'))).status).toBe(403)
    expect(fetch).not.toHaveBeenCalled()
  })
  it('forwards exact raw JSON and session without unrelated cookies', async () => {
    const body = '{"id":9007199254740993,"amount":99999999999999999.99}'
    const fetch = vi.fn(async (_url, init: RequestInit) => {
      expect(init.body).toBe(body)
      expect(new Headers(init.headers).get('cookie')).toBe('JSESSIONID=test')
      expect(new Headers(init.headers).get('X-CSRF-TOKEN')).toBe('fresh')
      expect(init.cache).toBe('no-store')
      return new Response(body, { headers: { 'Content-Type': 'application/json' } })
    }); vi.stubGlobal('fetch', fetch)
    const response = await PUT(request('transactions/9007199254740993','PUT',{body,token:'fresh',cookie:'JSESSIONID=test; unrelated=secret'}),context('transactions/9007199254740993'))
    expect(await response.text()).toBe(body)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(fetch).toHaveBeenCalledOnce()
  })
  it('preserves empty success and domain conflicts while masking internal failures', async () => {
    const fetch = vi.fn();vi.stubGlobal('fetch', fetch)
    for (const [status, expected] of [[204,204],[409,409],[302,502],[500,502]]) {
      fetch.mockResolvedValueOnce(new Response(status === 204 ? null : 'diagnostic', { status }))
      const response=await DELETE(request('categories/1','DELETE',{token:'t'}),context('categories/1'))
      expect(response.status).toBe(expected)
      if (status !== 409) expect(await response.text()).toBe('')
    }
    fetch.mockRejectedValueOnce(new DOMException('timeout','TimeoutError'))
    expect((await GET(request('categories'),context('categories'))).status).toBe(503)
  })
})
