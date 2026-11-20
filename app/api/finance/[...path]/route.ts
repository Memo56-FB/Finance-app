import { NextRequest, NextResponse } from 'next/server'
import { appOrigin, upstreamPath } from '@/lib/api/upstream'
import { financePath } from '@/lib/api/finance-path'
import { bodyText } from '@/lib/api/request'

export const runtime = 'nodejs'
const cacheHeaders = { 'Cache-Control': 'private, no-store' }
function reply(status: number) { return new NextResponse(null, { status, headers: cacheHeaders }) }

async function handle(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  const target = financePath(path, request.nextUrl.searchParams, request.method)
  if (target.status !== 200) return reply(target.status)
  const session = request.cookies.get('JSESSIONID')?.value
  if (!session || request.cookies.get('finance-guest')?.value === '1') return reply(401)
  try {
    const headers = new Headers({ Cookie: 'JSESSIONID=' + encodeURIComponent(session) })
    let body: string | undefined
    if (request.method !== 'GET') {
      const token = request.headers.get('x-csrf-token')
      if (request.headers.get('origin') !== appOrigin() || !token) return reply(403)
      headers.set('X-CSRF-TOKEN', token)
      headers.set('Origin', appOrigin())
      try { body = await bodyText(request) } catch { return reply(400) }
      if (body) {
        if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') return reply(415)
        headers.set('Content-Type', 'application/json')
      }
    }
    const result = await upstreamPath(target.path, {
      method: request.method, headers, body,
      signal: request.method === 'GET' ? request.signal : undefined,
    })
    if (result.status >= 300 && result.status < 400 || result.status >= 500) return reply(502)
    const response = new NextResponse(result.status === 204 ? null : await result.arrayBuffer(), {
      status: result.status,
      headers: { ...cacheHeaders, 'Content-Type': result.headers.get('content-type') ?? 'application/json', ...(result.headers.has('date') ? { Date: result.headers.get('date')! } : {}) },
    })
    for (const cookie of result.headers.getSetCookie()) if (cookie.startsWith('JSESSIONID=')) response.headers.append('Set-Cookie', cookie)
    return response
  } catch { return reply(503) }
}
export { handle as GET, handle as POST, handle as PUT, handle as DELETE }
