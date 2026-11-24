import { afterEach, expect, it, vi } from 'vitest'
import type { DehydratedState } from '@tanstack/react-query'
import { FinanceHydration } from './server'

const cookie=vi.hoisted(()=>({session:'a'}))
vi.mock('next/headers',()=>({cookies:async()=>({get:(key:string)=>key === 'JSESSIONID' ? {value:cookie.session} : undefined})}))
afterEach(()=>vi.unstubAllGlobals())
it('uses direct no-store reads and separate hydrated caches for concurrent accounts',async()=>{
  vi.stubGlobal('fetch',vi.fn(async (_url,init:RequestInit)=>{
    const owner=new Headers(init.headers).get('Cookie')!
    expect(init.cache).toBe('no-store')
    return new Response('{"items":[{"id":9007199254740993,"name":"'+owner+'"}]}')
  }))
  cookie.session='a'
  const a=await FinanceHydration({account:'account-a',section:'categories',params:{},children:null})
  cookie.session='b'
  const b=await FinanceHydration({account:'account-b',section:'categories',params:{},children:null})
  const state = async (props: {state: DehydratedState}) => Promise.all(props.state.queries.map(async query => ({
    key: query.queryKey, data: await query.promise ?? query.state.data,
  })))
  const stateA = JSON.stringify(await state(a.props)), stateB = JSON.stringify(await state(b.props))
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
  const entry = await FinanceHydration({account:'account-a', section, params:{month:'2027-13'}, children:null})
  await Promise.allSettled((entry.props.state as DehydratedState).queries.map(query => query.promise))
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
