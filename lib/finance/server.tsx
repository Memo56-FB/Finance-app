import 'server-only'
import { cookies } from 'next/headers'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { upstreamPath } from '@/lib/api/upstream'
import { ApiError } from '@/lib/api/client'
import { parseFinance } from '@/lib/api/finance-json'
import { financialServices } from './services'
import { financeQueries, filtersFromURL } from './queries'
import type { SearchParams } from '@/lib/auth/types'
import type { Section } from './types'

export async function FinanceHydration({ account, section, params, children }: { account:string; section:Section; params:SearchParams; children:React.ReactNode }) {
  const jar=await cookies()
  const session=jar.get('JSESSIONID')?.value
  const source=financialServices(async (path,signal) => {
    if(!session || jar.get('finance-guest')?.value === '1') throw new ApiError(401)
    const response=await upstreamPath('/api/'+path,{ headers:{Cookie:'JSESSIONID='+encodeURIComponent(session)},signal })
    if(!response.ok) throw new ApiError(response.status)
    return parseFinance(await response.text())
  })
  const queries=financeQueries(account,source)
  const client=new QueryClient()
  const search=new URLSearchParams()
  for(const [key,value] of Object.entries(params)) if(typeof value === 'string') search.set(key,value)
  const month=search.get('month') || undefined
  const requests:Promise<unknown>[]=[]
  if(['categories','transactions','budgets','recurring'].includes(section)) requests.push(client.prefetchQuery(queries.categories()))
  if(section === 'transactions') requests.push(client.prefetchQuery(queries.transactions(filtersFromURL(search))))
  if(section === 'budgets' || section === 'overview') requests.push(client.prefetchQuery(queries.budgets(section === 'overview' ? undefined : month)))
  if(section === 'pots' || section === 'overview') requests.push(client.prefetchQuery(queries.pots()))
  if(section === 'recurring') requests.push(client.prefetchQuery(queries.recurring(filtersFromURL(search,true))))
  if(section === 'recurring' || section === 'overview') requests.push(client.prefetchQuery(queries.paymentSummary(section === 'overview' ? undefined : month)))
  if(section === 'overview') requests.push(client.prefetchQuery(queries.summary()),client.prefetchQuery(queries.settings()),client.prefetchQuery(queries.transactions({sort:'newest',size:4,page:0})))
  await Promise.allSettled(requests)
  return <HydrationBoundary state={dehydrate(client)}>{children}</HydrationBoundary>
}
