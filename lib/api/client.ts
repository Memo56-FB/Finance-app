import axios from 'axios'

export class ApiError extends Error {
  constructor(public status: number, public fields: string[] = []) { super('Authentication request failed') }
}
export const api = axios.create({ baseURL: '/api/auth', withCredentials: true, timeout: 15_000 })
type Csrf = { token: string; headerName: string }
let csrf: Promise<Csrf> | undefined
export function clearCsrf() { csrf = undefined }
api.interceptors.request.use(async config => {
  if (config.method === 'post' && ['login', 'register', 'logout'].includes(config.url ?? '')) {
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
  const errors = axios.isAxiosError(error) ? error.response?.data?.errors : undefined
  const fields = Array.isArray(errors) ? errors.map(e => e?.field).filter((f): f is string => ['name', 'email', 'password'].includes(f)) : []
  return Promise.reject(new ApiError(status, fields))
})
