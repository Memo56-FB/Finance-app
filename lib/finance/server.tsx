import 'server-only'
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { defaultShouldDehydrateQuery, dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { redirect } from 'next/navigation'
import { sessionTag } from '@/lib/auth/session-tag'
import { FinanceShell } from '@/app/ui/finance/FinanceShell'
import { PageHeader, SaveOperations } from '@/app/ui/finance/common'
import { CardsSkeleton, LoadingRegion } from '@/app/ui/finance/Loading'
import { Text } from '@/lib/i18n/client'
import { Button } from '@/components/ui/button'
import { AccountScope } from './AccountScope'
import { FinanceView } from '@/app/ui/finance/FinanceView'
import { upstreamPath } from '@/lib/api/upstream'
import { ApiError } from '@/lib/api/client'
import { parseFinance } from '@/lib/api/finance-json'
import { validMonth } from '@/lib/api/finance-path'
import { financialServices } from './services'
import { financeQueries, filtersFromURL, recentTransactionFilters } from './queries'
import { destination, type SearchParams } from '@/lib/auth/types'
import type { Section } from './types'

const sectionTitles = {
  overview: 'Overview',
  categories: 'Categories',
  transactions: 'Transactions',
  budgets: 'Budgets',
  pots: 'Pots',
  recurring: 'Recurring Bills',
} as const
export async function FinanceEntry({ path, section, searchParams }: { path: string; section: Section; searchParams: Promise<SearchParams> }) {
  const [params, jar] = await Promise.all([searchParams, cookies()])
  if (jar.get('finance-guest')?.value === '1') return <FinanceShell kind="guest"><FinanceView guest /></FinanceShell>

  const session = jar.get('JSESSIONID')?.value
  const returnTo = destination(path, params)
  const login = '/login?' + new URLSearchParams({ next: returnTo })
  if (!session) redirect(login)

  return <Suspense fallback={<div className="grid gap-400 p-300">
    <PageHeader title={sectionTitles[section]} />
    <LoadingRegion><CardsSkeleton /></LoadingRegion>
  </div>}>
    <AuthorizedEntry session={session} section={section} params={params} returnTo={returnTo} />
  </Suspense>
}

async function AuthorizedEntry({ session, section, params, returnTo }: {
  session: string; section: Section; params: SearchParams; returnTo: string
}) {
  const tag = sessionTag(session)
  const client = await loadFinanceSection(session, tag, section, params).catch(error => {
    if (error instanceof ApiError && error.status === 401) redirect('/login?' + new URLSearchParams({ next: returnTo }))
    return null
  })
  if (!client) {
    const [pathname, query] = returnTo.split('?')
    return <main className="p-300">
      <p role="alert"><Text id="Authentication is unavailable. Please retry." /></p>
      <form action={pathname} method="get">
        {[...new URLSearchParams(query)].map(([name, value], index) => <input key={index} type="hidden" name={name} value={value} />)}
        <Button type="submit" variant="secondary"><Text id="Retry session check" /></Button>
      </form>
    </main>
  }

  const state = dehydrate(client, {
    shouldDehydrateQuery: query => defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
  })
  return <FinanceShell kind="account">
    <AccountScope key={tag} account={tag} sessionTag={tag}>
      <HydrationBoundary state={state}><SaveOperations><FinanceView guest={false} /></SaveOperations></HydrationBoundary>
    </AccountScope>
  </FinanceShell>
}

export async function loadFinanceSection(session: string, account: string, section: Section, params: SearchParams) {
  const source = financialServices(async (path, signal) => {
    const response = await upstreamPath('/api/' + path, { headers: { Cookie: 'JSESSIONID=' + encodeURIComponent(session) }, signal })
    if (!response.ok) throw new ApiError(response.status)
    return parseFinance(await response.text())
  })
  const queries=financeQueries(account,source)
  const client=new QueryClient()
  const search=new URLSearchParams()
  for(const [key,value] of Object.entries(params)) if(typeof value === 'string') search.set(key,value)
  const requestedMonth = search.get('month') ?? ''
  const month = validMonth(requestedMonth) ? requestedMonth : undefined
  const required = {
    overview: () => client.fetchQuery(queries.summary()),
    transactions: () => client.fetchQuery(queries.categories()),
    categories: () => client.fetchQuery(queries.categories()),
    budgets: () => client.fetchQuery(queries.budgets(month)),
    pots: () => client.fetchQuery(queries.pots()),
    recurring: () => client.fetchQuery(queries.paymentSummary(month)),
  }[section]()
  if (section === 'transactions') void client.prefetchQuery(queries.transactions(filtersFromURL(search)))
  if (section === 'recurring') void client.prefetchQuery(queries.recurring(filtersFromURL(search, true)))
  if (section === 'overview') {
    void client.prefetchQuery(queries.budgets())
    void client.prefetchQuery(queries.pots())
    void client.prefetchQuery(queries.paymentSummary())
    void client.prefetchQuery(queries.settings())
    void client.prefetchQuery(queries.transactions(recentTransactionFilters))
  }
  await required
  return client
}
