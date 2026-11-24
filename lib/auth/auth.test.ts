import { beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
vi.mock('server-only', () => ({}))
const mock = vi.hoisted(() => ({ cookies: vi.fn() }))
vi.mock('next/headers', () => mock)
import { getAccess } from './server'
import { safeNext } from './types'
import { credentialErrors } from './validation'
import { GET, POST, DELETE } from '@/app/api/auth/[action]/route'
import { makeQueryClient } from '@/lib/api/QueryProvider'

beforeEach(() => {
  vi.restoreAllMocks()
  process.env.FINANCE_APP_ORIGIN = 'http://localhost:3000'
  process.env.FINANCE_API_URL = 'http://localhost:8080'
})
const context = (action: string) => ({ params: Promise.resolve({ action }) })
function request(action: string, method = 'GET', headers: Record<string, string> = {}, body?: string) {
  return new NextRequest('http://localhost:3000/api/auth/' + action, { method, headers: { Origin: 'http://localhost:3000', ...headers }, body })
}
it('isolates query caches and validates redirects', () => {
  const a = makeQueryClient(), b = makeQueryClient()
  a.setQueryData(['auth'], 'private')
  expect(b.getQueryData(['auth'])).toBeUndefined()
  for (const path of ['https://evil.test','//evil.test','/\\evil.test','/login','/%2f%2fevil.test','/finance/../login']) expect(safeNext(path)).toBe('/finance')
  expect(safeNext('/finance/transactions?query=Emma&page=2')).toBe('/finance/transactions?query=Emma&page=2')
})
it('accepts normalized usernames and rejects invalid identifiers on both forms', () => {
  for (const register of [false, true]) {
    const check = (username: string) => credentialErrors({name:'María', username, password:'test-password'}, register)
    for (const username of ['a', '  User_01.A-B  ', 'a'.repeat(254)]) expect(check(username)).toEqual([])
    for (const username of ['', 'a'.repeat(255), 'a@b.com', 'two words', 'maría']) expect(check(username)).toContain('username')
  }
})
it('checks password UTF-8 boundaries without trimming significant spaces', () => {
  const values = { name: 'María', username: 'maria', password: 'abcdefgh' }
  for (const password of ['a'.repeat(72),'é'.repeat(36),'  abcdefgh  ']) expect(credentialErrors({ ...values, password }, true)).toEqual([])
  for (const password of ['a'.repeat(73),'é'.repeat(37),'abcdefg','        ']) expect(credentialErrors({ ...values, password }, true)).toContain('password')
})
it('distinguishes anonymous, guest, failed and isolated account lookups', async () => {
  const fetch = vi.spyOn(globalThis, 'fetch')
  mock.cookies.mockResolvedValueOnce({ get: () => undefined })
  expect(await getAccess()).toEqual({ kind: 'anonymous' })
  mock.cookies.mockResolvedValueOnce({ get: (key: string) => key === 'finance-guest' ? { value: '1' } : undefined })
  expect(await getAccess()).toEqual({ kind: 'guest' })
  expect(fetch).not.toHaveBeenCalled()
  mock.cookies.mockImplementation(async () => ({ get: (key: string) => key === 'JSESSIONID' ? { value: 'a' } : undefined }))
  fetch.mockResolvedValueOnce(new Response(null, { status: 401 }))
  expect(await getAccess()).toEqual({ kind: 'anonymous' })
  fetch.mockRejectedValueOnce(new Error('network'))
  expect(await getAccess()).toEqual({ kind: 'unavailable' })
  fetch.mockResolvedValueOnce(Response.json({ username: 'first' })).mockResolvedValueOnce(Response.json({ username: 'second' }))
  expect(await Promise.all([getAccess(),getAccess()])).toEqual([{kind:'account',username:'first'},{kind:'account',username:'second'}])
  fetch.mockResolvedValueOnce(Response.json({ password: 'not an identity' }))
  expect(await getAccess()).toEqual({ kind: 'unavailable' })
})
it('rejects untrusted methods, origins, missing CSRF and invalid bodies before forwarding', async () => {
  const fetch = vi.spyOn(globalThis, 'fetch')
  expect((await GET(request('unknown'),context('unknown'))).status).toBe(404)
  expect((await GET(request('login'),context('login'))).status).toBe(405)
  expect((await POST(request('guest','POST',{Origin:'https://evil.test'}),context('guest'))).status).toBe(403)
  expect((await POST(request('login','POST'),context('login'))).status).toBe(403)
  expect((await POST(request('register','POST',{'X-CSRF-TOKEN':'t','Content-Type':'application/json'},'null'),context('register'))).status).toBe(400)
  expect(fetch).not.toHaveBeenCalled()
})
it('creates and removes guest access locally and denies private identity', async () => {
  const fetch = vi.spyOn(globalThis, 'fetch')
  const entered = await POST(request('guest','POST'),context('guest'))
  expect(entered.status).toBe(204)
  expect(entered.cookies.get('finance-guest')).toMatchObject({value:'1',httpOnly:true,sameSite:'lax',path:'/'})
  expect((await GET(request('me','GET',{ Cookie:'finance-guest=1; JSESSIONID=old' }),context('me'))).status).toBe(401)
  const exited = await DELETE(request('guest','DELETE'),context('guest'))
  expect(exited.cookies.get('finance-guest')?.maxAge).toBe(0)
  expect(fetch).not.toHaveBeenCalled()
})
it('forwards required cookies and preserves rotation, deletion and empty responses', async () => {
  const fetch = vi.spyOn(globalThis,'fetch').mockResolvedValueOnce(new Response(null,{status:204,headers:{'Set-Cookie':'JSESSIONID=new; Path=/; HttpOnly; SameSite=Lax'}}))
  const response = await POST(request('login','POST',{'X-CSRF-TOKEN':'t','Content-Type':'application/x-www-form-urlencoded', Cookie:'finance-language=es; JSESSIONID=old; unrelated=secret'},'username=sample&password=secret'),context('login'))
  expect(response.status).toBe(204);expect(await response.text()).toBe('')
  const headers = fetch.mock.calls[0][1]?.headers as Headers
  expect(headers.get('Cookie')).toBe('JSESSIONID=old')
  expect(headers.get('X-CSRF-TOKEN')).toBe('t')
  expect(response.headers.get('set-cookie')).toContain('JSESSIONID=new')
  fetch.mockResolvedValueOnce(new Response(null,{status:204,headers:{'Set-Cookie':'JSESSIONID=; Path=/; Max-Age=0; HttpOnly'}}))
  const logout = await POST(request('logout','POST',{'X-CSRF-TOKEN':'t'}),context('logout'))
  expect(logout.headers.get('set-cookie')).toContain('Max-Age=0')
})

it('bounds incoming credentials and hides upstream infrastructure failures', async () => {
  const fetch = vi.spyOn(globalThis,'fetch')
  const response = await POST(request('register','POST',{'X-CSRF-TOKEN':'t','Content-Type':'application/json'},JSON.stringify({name:'a',username:'sample',password:'x'.repeat(9000)})),context('register'))
  expect(response.status).toBe(400)
  expect(fetch).not.toHaveBeenCalled()
  fetch.mockRejectedValueOnce(new Error('private infrastructure details'))
  const failed = await GET(request('csrf'),context('csrf'))
  expect(failed.status).toBe(503)
  expect(await failed.text()).not.toContain('private')
})

it('only extends a live session cookie after a successful remembered login', async () => {
  const session = 'JSESSIONID=new; Path=/; HttpOnly; Secure; SameSite=Lax'
  const deletion = 'JSESSIONID=; Path=/; Max-Age=0; HttpOnly'
  const fetch = vi.spyOn(globalThis, 'fetch')
  const headers = { 'X-CSRF-TOKEN': 't', 'Content-Type': 'application/x-www-form-urlencoded' }
  const remembered = 'username=sample&password=secret&remember-me=true'
  fetch.mockResolvedValueOnce(new Response(null, {status:401, headers:{'Set-Cookie':session}}))
  const failed = await POST(request('login','POST',headers,remembered),context('login'))
  expect(failed.headers.getSetCookie()).toEqual([session])

  fetch.mockResolvedValueOnce(new Response(null, {status:204, headers:[['Set-Cookie', deletion], ['Set-Cookie', session]]}))
  const signedIn = await POST(request('login','POST',headers,remembered),context('login'))
  expect(signedIn.headers.getSetCookie().filter(cookie => cookie.startsWith('JSESSIONID=')))
    .toEqual([deletion, session + '; Max-Age=2592000'])
})
