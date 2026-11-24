import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '@/app/api/finance/[...path]/route'
import { sessionTag } from '@/lib/auth/session-tag'
import { financePath } from './finance-path'

afterEach(() => vi.unstubAllGlobals())
function request(path: string, method = 'GET', options: { cookie?: string; origin?: string; token?: string; tag?: string; body?: string; signal?: AbortSignal } = {}) {
  const headers: Record<string, string> = { Cookie: options.cookie ?? 'JSESSIONID=test', Origin: options.origin ?? 'http://localhost:3000', 'Content-Type': 'application/json' }
  if (options.tag) headers['x-finance-session'] = options.tag
  if (options.token) headers['X-CSRF-TOKEN'] = options.token
  return new NextRequest('http://localhost:3000/api/finance/' + path, { method, headers, signal: options.signal, ...(options.body ? { body: options.body } : {}) })
}
const context = (path: string) => ({ params: Promise.resolve({ path: path.split('?')[0].split('/') }) })

describe('closed finance forwarding', () => {
  it('propagates an abandoned GET while a separate POST can finish once', async () => {
    const pending = Promise.withResolvers<Response>()
    const started = Promise.withResolvers<AbortSignal>()
    const fetch = vi.fn((_url: URL, init: RequestInit) => {
      if (init.method === 'POST') return pending.promise
      const signal = init.signal!
      started.resolve(signal)
      return new Promise<Response>((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), {once:true}))
    })
    vi.stubGlobal('fetch', fetch)
    const read = new AbortController(), write = new AbortController()
    const reading = GET(request('categories', 'GET', {signal:read.signal}), context('categories'))
    const writing = POST(request('categories', 'POST', {token:'t', body:'{}', signal:write.signal}), context('categories'))
    const upstreamSignal = await started.promise
    read.abort()
    write.abort()
    expect(upstreamSignal.aborted).toBe(true)
    expect((await reading).status).toBe(503)
    pending.resolve(new Response('{}', {status:201}))
    expect((await writing).status).toBe(201)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch.mock.calls.find(([, options]) => options.method === 'POST')?.[1].signal?.aborted).toBe(false)
  })
  it('validates paths, methods and parameters before contacting Spring', () => {
    for (const [path, method, status] of [['auth/login','POST',404],['transactions/1','POST',405],['transactions?categoryId=0','GET',400],['transactions?page=2147483648','GET',400],['transactions?size=0','GET',400],['budgets?month=2027-13','GET',400],['transactions?evil=x','GET',400],['transactions?size=1&size=2','GET',400]] as const) {
      const [route, query] = path.split('?')
      expect(financePath(route.split('/'), new URLSearchParams(query), method).status).toBe(status)
    }
    expect(financePath(['transactions'], new URLSearchParams('categoryId=9007199254740993'), 'GET').status).toBe(200)
  })
  it('accepts a single valid month only on monthly reads', () => {
    const query = new URLSearchParams('month=2027-02')
    for (const path of ['financial-summary','transactions','budgets','budgets/1','savings-pots','recurring-payments','recurring-payments/1','recurring-payments/summary']) {
      expect(financePath(path.split('/'), query, 'GET').path).toBe('/api/'+path+'?month=2027-02')
      expect(financePath(path.split('/'), new URLSearchParams('month=2027-00'), 'GET').status).toBe(400)
    }
    for (const [path, method] of [['transactions','POST'],['financial-summary/settings','GET'],['categories','GET'],['savings-pots/1','GET'],['transactions/1','GET']]) {
      expect(financePath(path.split('/'), query, method).status).toBe(400)
    }
  })
  it('rejects anonymous, guest, cross-origin and missing CSRF requests', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch)
    expect((await GET(request('categories','GET',{cookie:''}),context('categories'))).status).toBe(401)
    expect((await GET(request('categories','GET',{cookie:'JSESSIONID=test; finance-guest=1'}),context('categories'))).status).toBe(401)
    expect((await POST(request('categories','POST',{token:'t',origin:'https://evil.test'}),context('categories'))).status).toBe(403)
    expect((await DELETE(request('categories/1','DELETE'),context('categories/1'))).status).toBe(403)
    expect(fetch).not.toHaveBeenCalled()
  })
  it('rejects a read or write from a tab bound to a previous session', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const options = { cookie: 'JSESSIONID=other', tag: sessionTag('previous'), token: 'fresh', body: '{}' }
    expect((await GET(request('categories', 'GET', { ...options, body: undefined }), context('categories'))).status).toBe(401)
    expect((await POST(request('categories', 'POST', options), context('categories'))).status).toBe(401)
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
