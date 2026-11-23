import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'
import { parseFinance, stringifyFinance } from './finance-json'

export class ApiError extends Error {
  constructor(public status: number, public fields: string[] = []) { super('Request failed') }
}
export const api = axios.create({ baseURL: '/api/auth', withCredentials: true, timeout: 15_000 })
type Csrf = { token: string; headerName: string }
let csrf: Promise<Csrf> | undefined
export function clearCsrf() { csrf = undefined }
api.interceptors.request.use(async config => {
  if (['post', 'put', 'delete'].includes(config.method ?? '') && (config.baseURL === '/api/finance' || ['login', 'register', 'logout'].includes(config.url ?? ''))) {
    csrf ??= api.get('csrf').then(({ data }) => {
      if (typeof data?.token !== 'string' || data.headerName !== 'X-CSRF-TOKEN') throw new ApiError(502)
      return data as Csrf
    }).catch(error => { clearCsrf(); throw error })
    const token = await csrf
    config.headers.set(token.headerName, token.token)
  }
  return config
})
api.interceptors.response.use(response => {
  if (['login', 'logout', 'guest'].includes(response.config.url ?? '') && response.config.method !== 'get') clearCsrf()
  return response
}, error => {
  if (error instanceof ApiError) return Promise.reject(error)
  const status = axios.isAxiosError(error) ? error.response?.status ?? 0 : 0
  if (status === 403) clearCsrf()
  if (status === 401 && error.config?.baseURL === '/api/finance' && typeof window !== 'undefined') window.dispatchEvent(new Event('finance-session-expired'))
  const errors = axios.isAxiosError(error) ? error.response?.data?.errors : undefined
  const fields = Array.isArray(errors) ? errors.map(e => e?.field === 'nonzeroAmount' ? 'amount' : e?.field === 'validInstallmentCount' ? 'totalInstallments' : e?.field === 'validInterval' ? 'intervalMonths' : e?.field).filter((f): f is string => ['name', 'username', 'password', 'amount', 'categoryId', 'transactionDate', 'spendingLimit', 'color', 'targetAmount', 'type', 'firstDueDate', 'totalInstallments', 'intervalMonths', 'startDay', 'frequency'].includes(f)) : []
  return Promise.reject(new ApiError(status, fields))
})

export async function financeRequest<T>(config: AxiosRequestConfig): Promise<T> {
  return (await financeResponse<T>(config)).data
}
export function financeResponse<T>(config:AxiosRequestConfig) {
  return api.request<T>({
    ...config, baseURL: '/api/finance',
    headers: { 'Content-Type': 'application/json', ...config.headers },
    transformRequest: [data => data === undefined ? undefined : stringifyFinance(data)],
    transformResponse: [data => {
      if (typeof data !== 'string') return data
      if (!data) return undefined
      try { return parseFinance(data) } catch { throw new ApiError(502) }
    }],
  })
}
