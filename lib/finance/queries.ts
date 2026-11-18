import { queryOptions } from '@tanstack/react-query'
import { finance } from './services'
import { financeSorts, validMonth } from '@/lib/api/finance-path'
import { validId } from '@/lib/api/finance-json'
import type { ListFilters } from './types'

export const financeKey = (account: string) => ['finance', account] as const
export function financeQueries(account: string, source = finance) {
  const key=financeKey(account)
  const base={ staleTime: 30_000, retry: false, refetchOnWindowFocus: 'always' as const }
  return {
    categories: () => queryOptions({ ...base, queryKey: [...key,'categories'], queryFn: ({signal}) => source.categories(signal) }),
    transactions: (filters: ListFilters = {}) => queryOptions({ ...base, queryKey: [...key,'transactions',filters], queryFn: ({signal}) => source.transactions(filters,signal) }),
    budgets: (month?: string) => queryOptions({ ...base, queryKey: [...key,'budgets',month ?? 'current'], queryFn: ({signal}) => source.budgets(month,signal) }),
    pots: () => queryOptions({ ...base, queryKey: [...key,'pots'], queryFn: ({signal}) => source.pots(signal) }),
    recurring: (filters: ListFilters = {}) => queryOptions({ ...base, queryKey: [...key,'recurring',filters], queryFn: ({signal}) => source.recurring(filters,signal) }),
    summary: () => queryOptions({ ...base, queryKey: [...key,'summary'], queryFn: ({signal}) => source.summary(signal) }),
    settings: () => queryOptions({ ...base, queryKey: [...key,'settings'], queryFn: ({signal}) => source.settings(signal) }),
    paymentSummary: (month?: string) => queryOptions({ ...base, queryKey: [...key,'payment-summary',month ?? 'current'], queryFn: ({signal}) => source.paymentSummary(month,signal) }),
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
