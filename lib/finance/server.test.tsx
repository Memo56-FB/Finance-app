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
