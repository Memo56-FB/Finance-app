import { afterEach, expect, it, vi } from 'vitest'
import { loadFinanceSection } from './server'

afterEach(()=>vi.unstubAllGlobals())
it('uses direct no-store reads and separate hydrated caches for concurrent accounts',async()=>{
  vi.stubGlobal('fetch',vi.fn(async (_url,init:RequestInit)=>{
    const owner=new Headers(init.headers).get('Cookie')!
    expect(init.cache).toBe('no-store')
    return new Response('{"items":[{"id":9007199254740993,"name":"'+owner+'"}]}')
  }))
  const [a, b] = await Promise.all([
    loadFinanceSection('a', 'account-a', 'categories', {}),
    loadFinanceSection('b', 'account-b', 'categories', {}),
  ])
  const stateA = JSON.stringify(a.getQueriesData({})), stateB = JSON.stringify(b.getQueriesData({}))
  expect(fetch).toHaveBeenCalledTimes(2)
  expect(stateA).toContain('9007199254740993');expect(stateA).toContain('account-a');expect(stateA).not.toContain('account-b')
  expect(stateB).toContain('account-b');expect(stateB).not.toContain('JSESSIONID=a')
})

it.each([
  ['overview', ['budgets','savings-pots','recurring-payments/summary','financial-summary','financial-summary/settings','transactions']],
  ['transactions', ['categories','transactions']],
  ['categories', ['categories']],
  ['budgets', ['budgets']],
  ['pots', ['savings-pots']],
  ['recurring', ['recurring-payments','recurring-payments/summary']],
] as const)('prefetches only the necessary reads for %s', async (section, expected) => {
  const fetch = vi.fn(async (_url: URL) => new Response(null, {status:503}))
  vi.stubGlobal('fetch', fetch)
  await expect(loadFinanceSection('a', 'account-a', section, {month:'2027-13'})).rejects.toMatchObject({ status: 503 })
  const urls = fetch.mock.calls.map(([url]) => url)
  expect(urls.map(url => url.pathname.slice(5)).sort()).toEqual([...expected].sort())
  expect(urls.every(url => !url.searchParams.has('month'))).toBe(true)
})

it('shares equivalent recent transaction keys and retains only the default lists', async () => {
  const { financeQueries, filtersFromURL, recentTransactionFilters } = await import('./queries')
  const queries = financeQueries('a')
  const base = queries.transactions(recentTransactionFilters)
  expect(queries.transactions(filtersFromURL(new URLSearchParams())).queryKey).toEqual(base.queryKey)
  expect(base.gcTime).toBe(Infinity)
  for (const params of ['page=2', 'category=7', 'query=food', 'sortBy=oldest']) {
    const variant = queries.transactions(filtersFromURL(new URLSearchParams(params)))
    expect(variant.queryKey).not.toEqual(base.queryKey)
    expect(variant.gcTime).not.toBe(Infinity)
  }
  expect(queries.transactions({ ...recentTransactionFilters, month: '2027-04' }).queryKey).not.toEqual(base.queryKey)
  expect(queries.transactions({ ...recentTransactionFilters, size: 8 }).queryKey).not.toEqual(base.queryKey)
  expect(financeQueries('b').transactions(recentTransactionFilters).queryKey).not.toEqual(base.queryKey)
})

it('accepts an empty protected result and rejects a session denied by Spring', async () => {
  const fetch = vi.fn()
    .mockResolvedValueOnce(Response.json({ items: [] }))
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
  vi.stubGlobal('fetch', fetch)
  const client = await loadFinanceSection('a', 'tag-a', 'categories', {})
  expect(client.getQueryData(['finance', 'tag-a', 'categories'])).toEqual({ items: [] })
  await expect(loadFinanceSection('b', 'tag-b', 'categories', {})).rejects.toMatchObject({ status: 401 })
  expect(fetch).toHaveBeenCalledTimes(2)
})
