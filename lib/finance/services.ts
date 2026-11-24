import { ApiError, financeRequest, financeResponse } from '@/lib/api/client'
import * as decode from './contracts'
import type { ListFilters } from './types'

export type ReadFinance = (path: string, signal?: AbortSignal) => Promise<unknown>
export const readFinance: ReadFinance = (url, signal) => financeRequest({ url, signal })
function query(filters: ListFilters) { const params=new URLSearchParams();for(const [key,value] of Object.entries(filters)) if(value !== undefined && value !== '') params.set(key,String(value));return params.size ? '?' + params : '' }
export function financialServices(read: ReadFinance = readFinance) {
  async function load<T>(path: string, decoder: (value: unknown) => T, signal?: AbortSignal): Promise<T> {
    const value=await read(path,signal)
    try { return decoder(value) } catch { throw new ApiError(502) }
  }
  return {
    categories: (signal?: AbortSignal) => load('categories',v => decode.list(v,decode.financialRow.categories),signal),
    transactions: (filters: ListFilters = {},signal?: AbortSignal) => load('transactions'+query(filters),v => decode.page(v,decode.financialRow.transactions),signal),
    budgets: (month?: string,signal?: AbortSignal) => load('budgets'+query({month}),v => decode.list(v,decode.financialRow.budgets),signal),
    pots: (month?: string,signal?: AbortSignal) => load('savings-pots'+query({month}),decode.potList,signal),
    recurring: (filters: ListFilters = {},signal?: AbortSignal) => load('recurring-payments'+query(filters),v => decode.page(v,decode.financialRow['recurring-payments']),signal),
    summary: (month?: string,signal?: AbortSignal) => load('financial-summary'+query({month}),decode.summary,signal),
    settings: (signal?: AbortSignal) => load('financial-summary/settings',decode.settings,signal),
    paymentSummary: (month?: string,signal?: AbortSignal) => load('recurring-payments/summary'+query({month}),decode.paymentSummary,signal),
  }
}
export const finance = financialServices()
export async function saveRecord<R extends decode.Resource>(resource: R, body: unknown, id?: string, signal?: AbortSignal) {
  return decode.financialRow[resource](await financeRequest({ url: resource+(id ? '/'+id : ''), method: id ? 'PUT' : 'POST', data: body, signal }))
}
export async function getRecord<R extends decode.Resource>(resource: R, id: string) { return decode.financialRow[resource](await readFinance(resource+'/'+id)) }
export async function deleteRecord(resource: decode.Resource, id: string, signal?: AbortSignal) {
  const result=await financeResponse({ url: resource+'/'+id, method: 'DELETE', signal })
  return resource === 'savings-pots' ? {...decode.deletion(result.data),serverTime:typeof result.headers.date === 'string' ? result.headers.date : undefined} : undefined
}
export async function movePot(id: string, action: 'deposits' | 'withdrawals', amount: string, signal?: AbortSignal) { return decode.financialRow['savings-pots'](await financeRequest({url:`savings-pots/${id}/${action}`,method:'POST',data:{amount},signal})) }
export async function restorePot(id: string, signal?: AbortSignal) { return decode.financialRow['savings-pots'](await financeRequest({url:`savings-pots/${id}/restore`,method:'POST',signal})) }
export async function payRecurring(id: string, month: string, signal?: AbortSignal) { return decode.recorded(await financeRequest({url:`recurring-payments/${id}/payments/${month}`,method:'PUT',signal})) }
export async function saveSettings(body: unknown, signal?: AbortSignal) { return decode.settings(await financeRequest({url:'financial-summary/settings',method:'PUT',data:body,signal})) }
