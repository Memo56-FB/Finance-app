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
  const a=await FinanceHydration({account:'a@example.test',section:'categories',params:{},children:null})
  cookie.session='b'
  const b=await FinanceHydration({account:'b@example.test',section:'categories',params:{},children:null})
  const stateA=JSON.stringify((a.props as {state:DehydratedState}).state),stateB=JSON.stringify((b.props as {state:DehydratedState}).state)
  expect(stateA).toContain('9007199254740993');expect(stateA).toContain('a@example.test');expect(stateA).not.toContain('b@example.test')
  expect(stateB).toContain('b@example.test');expect(stateB).not.toContain('JSESSIONID=a')
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
  await FinanceHydration({account:'a@example.test', section, params:{month:'2027-13'}, children:null})
  const urls = fetch.mock.calls.map(([url]) => url)
  expect(urls.map(url => url.pathname.slice(5)).sort()).toEqual([...expected].sort())
  expect(urls.every(url => !url.searchParams.has('month'))).toBe(true)
})
