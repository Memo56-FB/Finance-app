import 'server-only'
import { cookies } from 'next/headers'
import { defaultShouldDehydrateQuery, dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { requireAccess } from '@/lib/auth/server'
import { FinanceView } from '@/app/ui/finance/FinanceView'
import { upstreamPath } from '@/lib/api/upstream'
import { ApiError } from '@/lib/api/client'
import { parseFinance } from '@/lib/api/finance-json'
import { validMonth } from '@/lib/api/finance-path'
import { financialServices } from './services'
import { financeQueries, filtersFromURL, recentTransactionFilters } from './queries'
import type { SearchParams } from '@/lib/auth/types'
import type { Section } from './types'

export async function FinanceEntry({ path, section, searchParams }: { path: string; section: Section; searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const access = await requireAccess(path, params)
  if (access.kind !== 'account') return <FinanceView guest />
  return <FinanceHydration account={access.username} section={section} params={params}><FinanceView guest={false} /></FinanceHydration>
}

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
  const requestedMonth = search.get('month') ?? ''
  const month = validMonth(requestedMonth) ? requestedMonth : undefined
  if (section === 'categories' || section === 'transactions') void client.prefetchQuery(queries.categories())
  if (section === 'transactions') void client.prefetchQuery(queries.transactions(filtersFromURL(search)))
  if (section === 'budgets' || section === 'overview') void client.prefetchQuery(queries.budgets(section === 'overview' ? undefined : month))
  if (section === 'pots' || section === 'overview') void client.prefetchQuery(queries.pots())
  if (section === 'recurring') void client.prefetchQuery(queries.recurring(filtersFromURL(search, true)))
  if (section === 'recurring' || section === 'overview') void client.prefetchQuery(queries.paymentSummary(section === 'overview' ? undefined : month))
  if (section === 'overview') {
    void client.prefetchQuery(queries.summary())
    void client.prefetchQuery(queries.settings())
    void client.prefetchQuery(queries.transactions(recentTransactionFilters))
  }
  const state = dehydrate(client, {
    shouldDehydrateQuery: query => defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
  })
  return <HydrationBoundary state={state}>{children}</HydrationBoundary>
}
