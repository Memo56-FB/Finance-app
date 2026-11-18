export type Account = { email: string }
export type Access = { kind: 'anonymous' | 'guest' | 'unavailable' } | { kind: 'account'; email: string }
export type SearchParams = Record<string, string | string[] | undefined>
export type PageProps = { searchParams: Promise<SearchParams> }
export const financeRoutes = ['/finance', '/finance/transactions', '/finance/categories', '/finance/budgets', '/finance/pots', '/finance/recurring-bills']
export function safeNext(value?: string) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value)) return '/finance'
  try {
    const url = new URL(value, 'http://internal')
    if (url.origin !== 'http://internal' || !financeRoutes.includes(url.pathname)) return '/finance'
    return url.pathname + url.search
  } catch { return '/finance' }
}
export function destination(path: string, params: SearchParams) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach(v => query.append(key, v))
    else if (value !== undefined) query.set(key, value)
  })
  return safeNext(path + (query.size ? '?' + query : ''))
}
