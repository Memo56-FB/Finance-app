import axios, { AxiosError, AxiosHeaders, type AxiosAdapter } from 'axios'
import { afterEach, expect, it, vi } from 'vitest'
import { api, ApiError, clearCsrf } from './client'
const original = api.defaults.adapter
afterEach(() => { api.defaults.adapter = original; clearCsrf() })
it('deduplicates CSRF, rotates it on login/logout, and does not replay failed POSTs', async () => {
  const paths: string[] = []
  api.defaults.adapter = async config => {
    paths.push(config.url!)
    if (config.url === 'csrf') return { data:{token:'fresh',headerName:'X-CSRF-TOKEN'},status:200,statusText:'OK',headers:new AxiosHeaders(),config }
    expect(config.headers.get('X-CSRF-TOKEN')).toBe('fresh')
    return {data:'',status:204,statusText:'',headers:new AxiosHeaders(),config}
  }
  await Promise.all([api.post('register',{}),api.post('register',{})])
  expect(paths.filter(p=>p==='csrf')).toHaveLength(1)
  await api.post('login',new URLSearchParams({password:'secret'}))
  await api.post('logout')
  expect(paths.filter(p=>p==='csrf')).toHaveLength(2)
  const calls = vi.fn<AxiosAdapter>(async config => {
    if (config.url === 'csrf') return {data:{token:'t',headerName:'X-CSRF-TOKEN'},status:200,statusText:'',headers:new AxiosHeaders(),config}
    throw new AxiosError('secret diagnostic','ERR_BAD_REQUEST',config,undefined,{data:{password:'secret'},status:403,statusText:'',headers:new AxiosHeaders(),config})
  })
  api.defaults.adapter = calls
  let failure: unknown
  try { await api.post('register',{password:'secret'}) } catch (e) { failure=e }
  expect(failure).toBeInstanceOf(ApiError)
  expect(JSON.stringify(failure)).not.toContain('secret')
  expect(calls).toHaveBeenCalledTimes(2)
  expect(axios.isAxiosError(failure)).toBe(false)
})
