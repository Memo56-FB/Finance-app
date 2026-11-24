import { queryOptions } from '@tanstack/react-query'
import { finance } from './services'
import { financeSorts, validMonth } from '@/lib/api/finance-path'
import { validId } from '@/lib/api/finance-json'
import type { ListFilters } from './types'

export const recentTransactionFilters = { sort: 'newest', size: 4, page: 0 } as const

function compactFilters(filters: ListFilters) {
  const next = { ...filters }
  if (next.search === '') delete next.search
  return next
}

export const financeKey = (account: string) => ['finance', account] as const
export function financeQueries(account: string, source = finance, enabled = true) {
  const key=financeKey(account)
  const base={ staleTime: Infinity, retry: false, enabled, refetchOnWindowFocus: false, refetchOnReconnect: false }
  const gcTime = (historical?: string) => historical ? undefined : Infinity
  const listOptions = (filters: ListFilters) => {
    const normalized = compactFilters(filters)
    const isBase = !normalized.search && !normalized.categoryId && !normalized.month &&
      (normalized.sort === 'newest' || normalized.sort === undefined) &&
      (normalized.page === 0 || normalized.page === undefined) &&
      (normalized.size === 4 || normalized.size === undefined)
    return { normalized, isBase }
  }
  return {
    categories: () => queryOptions({ ...base, gcTime: Infinity, queryKey: [...key,'categories'], queryFn: () => source.categories() }),
    transactions: (filters: ListFilters = {}) => {
      const { normalized, isBase } = listOptions(filters)
      return queryOptions({
        ...base, gcTime: isBase ? Infinity : undefined,
        queryKey: [...key, 'transactions', normalized],
        // The two views can temporarily have no observer while switching sections.
        queryFn: context => source.transactions(normalized, isBase ? undefined : context.signal),
      })
    },
    budgets: (month?: string) => queryOptions({ ...base, gcTime: gcTime(month), queryKey: [...key,'budgets',month ?? 'current'], queryFn: ({signal}) => source.budgets(month,signal) }),
    pots: (month?: string) => queryOptions({ ...base, gcTime: gcTime(month), queryKey: [...key,'pots',month ?? 'current'], queryFn: ({signal}) => source.pots(month,signal) }),
    recurring: (filters: ListFilters = {}) => {
      const { normalized, isBase } = listOptions(filters)
      return queryOptions({ ...base, gcTime: isBase ? Infinity : undefined, queryKey: [...key, 'recurring', normalized], queryFn: ({signal}) => source.recurring(normalized, signal) })
    },
    summary: (month?: string) => queryOptions({ ...base, gcTime: gcTime(month), queryKey: [...key,'summary',month ?? 'current'], queryFn: ({signal}) => source.summary(month,signal) }),
    settings: () => queryOptions({ ...base, gcTime: Infinity, queryKey: [...key,'settings'], queryFn: ({signal}) => source.settings(signal) }),
    paymentSummary: (month?: string) => queryOptions({ ...base, gcTime: gcTime(month), queryKey: [...key,'payment-summary',month ?? 'current'], queryFn: ({signal}) => source.paymentSummary(month,signal) }),
  }
}
export function filtersFromURL(params: URLSearchParams, recurring = false): ListFilters {
  const page=Number(params.get('page') ?? 1)
  const name=params.get('sortBy') ?? 'Latest'
  const sort=financeSorts.includes(name as typeof financeSorts[number]) ? name : ({Latest:'newest',Oldest:'oldest','A to Z':'name_asc','Z to A':'name_desc',Highest:'amount_desc',Lowest:'amount_asc'} as Record<string,string>)[name] ?? 'newest'
  const category=params.get('category') ?? ''
  return { search: params.get('query') ?? '', sort, page: Number.isInteger(page) && page >= 1 && page <= 2147483647 ? page-1 : 0, size: 4,
    ...(!recurring && validId(category) ? {categoryId:category} : {}), ...(recurring && validMonth(params.get('month') ?? '') ? {month:params.get('month')!} : {}),
  }
}
