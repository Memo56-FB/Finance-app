import { validId } from './finance-json'

export const financeSorts = ['newest', 'oldest', 'name_asc', 'name_desc', 'amount_desc', 'amount_asc'] as const
export function validMonth(value: string) { return /^(?!0000)\d{4}-(?:0[1-9]|1[0-2])$/.test(value) }

export function financePath(path: string[], query: URLSearchParams, method: string) {
  const [resource, id, action, month] = path
  let methods: string[] | undefined
  const params: string[] = []
  if (['categories', 'transactions', 'budgets', 'savings-pots', 'recurring-payments'].includes(resource)) {
    if (path.length === 1) methods = ['GET', 'POST']
    else if (path.length === 2 && validId(id)) methods = ['GET', 'PUT', 'DELETE']
  }
  if (resource === 'financial-summary' && path.length === 1) methods = ['GET']
  if (resource === 'financial-summary' && id === 'settings' && path.length === 2) methods = ['GET', 'PUT']
  if (resource === 'recurring-payments' && id === 'summary' && path.length === 2) methods = ['GET']
  if (resource === 'savings-pots' && path.length === 3 && validId(id) && ['deposits', 'withdrawals', 'restore'].includes(action)) methods = ['POST']
  if (resource === 'recurring-payments' && path.length === 4 && validId(id) && action === 'payments' && validMonth(month)) methods = ['PUT']
  if (!methods) return { status: 404 } as const
  if (!methods.includes(method)) return { status: 405 } as const
  if (method === 'GET') {
    if (['budgets', 'recurring-payments'].includes(resource) ||
        (path.length === 1 && ['financial-summary', 'transactions', 'savings-pots'].includes(resource))) params.push('month')
    if (path.length === 1 && ['transactions', 'recurring-payments'].includes(resource)) params.push('search', 'page', 'size', 'sort')
    if (resource === 'transactions' && path.length === 1) params.push('categoryId')
  }
  for (const [key, value] of query) {
    if (!params.includes(key) || query.getAll(key).length !== 1) return { status: 400 } as const
    if (key === 'month' && !validMonth(value) || key === 'categoryId' && !validId(value) || key === 'sort' && !financeSorts.includes(value as typeof financeSorts[number])) return { status: 400 } as const
    if (['page', 'size'].includes(key) && (!/^\d+$/.test(value) || Number(value) > (key === 'size' ? 100 : 2147483647) || key === 'size' && Number(value) < 1)) return { status: 400 } as const
  }
  return { status: 200, path: '/api/' + path.join('/') + (query.size ? '?' + query : '') } as const
}
