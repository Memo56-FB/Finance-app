import { NextRequest, NextResponse } from 'next/server'
import { appOrigin, upstream } from '@/lib/api/upstream'

export const runtime = 'nodejs'
const methods: Record<string, string[]> = { csrf: ['GET'], me: ['GET'], register: ['POST'], login: ['POST'], logout: ['POST'], guest: ['POST', 'DELETE'] }
const cacheHeaders = { 'Cache-Control': 'private, no-store' }
function reply(status: number) { return new NextResponse(null, { status, headers: cacheHeaders }) }
function clearGuest(response: NextResponse, secure: boolean) {
  response.cookies.set('finance-guest', '', { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 0 })
}
async function bodyText(request: NextRequest) {
  if (Number(request.headers.get('content-length')) > 8192) throw new Error('Body too large')
  const reader = request.body?.getReader()
  if (!reader) return ''
  let size = 0
  const chunks: Uint8Array[] = []
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    size += value.length
    if (size > 8192) { await reader.cancel(); throw new Error('Body too large') }
    chunks.push(value)
  }
  return Buffer.concat(chunks).toString('utf8')
}
async function handle(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params
  if (!Object.hasOwn(methods, action)) return reply(404)
  if (!methods[action].includes(request.method)) return reply(405)
  try {
    const mutating = request.method !== 'GET'
    if (mutating && request.headers.get('origin') !== appOrigin()) return reply(403)
    const secure = appOrigin().startsWith('https:')
    if (action === 'guest') {
      const response = reply(204)
      response.cookies.set('finance-guest', request.method === 'POST' ? '1' : '', {
        httpOnly: true, sameSite: 'lax', secure, path: '/', ...(request.method === 'DELETE' ? { maxAge: 0 } : {}),
      })
      response.cookies.set('JSESSIONID', '', { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 0 })
      return response
    }
    if (action === 'me' && request.cookies.get('finance-guest')?.value === '1') return reply(401)
    const headers = new Headers()
    const session = request.cookies.get('JSESSIONID')?.value
    if (session) headers.set('Cookie', 'JSESSIONID=' + encodeURIComponent(session))
    let body: string | undefined
    if (mutating) {
      const token = request.headers.get('x-csrf-token')
      if (!token) return reply(403)
      headers.set('X-CSRF-TOKEN', token)
      headers.set('Origin', appOrigin())
      try {
        body = await bodyText(request)
        if (action === 'register') {
          if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') return reply(415)
          const data = JSON.parse(body)
          if (!data || typeof data !== 'object' || !['name', 'email', 'password'].every(k => typeof data[k] === 'string')) return reply(400)
          headers.set('Content-Type', 'application/json')
        } else if (action === 'login') {
          if (request.headers.get('content-type')?.split(';')[0] !== 'application/x-www-form-urlencoded') return reply(415)
          const data = new URLSearchParams(body)
          if (!data.has('email') || !data.has('password')) return reply(400)
          headers.set('Content-Type', 'application/x-www-form-urlencoded')
        }
      } catch { return reply(400) }
    }
    const result = await upstream(action, { method: request.method, headers, body })
    if (result.status >= 500 || result.status >= 300 && result.status < 400) return reply(502)
    const response = new NextResponse(result.status === 204 ? null : await result.arrayBuffer(), {
      status: result.status, headers: { ...cacheHeaders, 'Content-Type': result.headers.get('content-type') ?? 'application/json' },
    })
    if ((action === 'login' || action === 'logout') && result.status === 204) clearGuest(response, secure)
    // NextResponse.cookies.set rewrites Set-Cookie, so append Spring's cookies last.
    for (const cookie of result.headers.getSetCookie()) {
      if (cookie.startsWith('JSESSIONID=')) response.headers.append('Set-Cookie', cookie)
    }
    return response
  } catch { return reply(503) }
}
export { handle as GET, handle as POST, handle as DELETE }
