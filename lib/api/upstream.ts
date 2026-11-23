import 'server-only'

export function appOrigin() {
  const origin = process.env.FINANCE_APP_ORIGIN ?? (process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : '')
  const url = new URL(origin)
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) throw new Error('Invalid application origin')
  return origin
}
export function upstream(action: string, init: RequestInit = {}) {
  return upstreamPath('/api/auth/' + action, init)
}
export function upstreamPath(path: string, init: RequestInit = {}) {
  const url = new URL(process.env.FINANCE_API_URL ?? 'http://localhost:8080')
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Invalid API origin')
  if (!path.startsWith('/api/') || path.includes('\\') || path.includes('#') || /[\r\n]/.test(path)) throw new Error('Invalid API path')
  // The Spring container can take longer than 10 seconds to start after idling.
  const timeout = AbortSignal.timeout(30_000)
  return fetch(new URL(path, url), { ...init, cache: 'no-store', redirect: 'manual', signal: init.signal ? AbortSignal.any([init.signal, timeout]) : timeout })
}
