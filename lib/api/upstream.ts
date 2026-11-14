import 'server-only'

export function appOrigin() {
  const origin = process.env.FINANCE_APP_ORIGIN ?? (process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : '')
  const url = new URL(origin)
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) throw new Error('Invalid application origin')
  return origin
}
export function upstream(action: string, init: RequestInit = {}) {
  const url = new URL(process.env.FINANCE_API_URL ?? 'http://localhost:8080')
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Invalid API origin')
  return fetch(new URL('/api/auth/' + action, url), { ...init, cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(10_000) })
}
