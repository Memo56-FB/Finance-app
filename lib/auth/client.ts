'use client'
import { useCallback } from 'react'
import { api, clearCsrf, ApiError } from '@/lib/api/client'
import { useQueryClient } from '@tanstack/react-query'
import { safeNext, type Account } from './types'

export const sessionChannel = 'finance-session'
export const leavingSession = 'finance-session-leaving'

export function announceSessionChange() {
  if (typeof BroadcastChannel !== 'function') return
  const channel = new BroadcastChannel(sessionChannel)
  channel.postMessage('changed')
  channel.close()
}

export async function currentAccount(signal?: AbortSignal): Promise<Account> {
  const { data } = await api.get('me', { signal })
  if (typeof data?.email !== 'string' || !data.email) throw new ApiError(502)
  return { email: data.email }
}
export function useAccessNavigation() {
  const client = useQueryClient()
  return useCallback(async (path: string) => {
    window.dispatchEvent(new Event(leavingSession))
    await client.cancelQueries()
    client.clear()
    clearCsrf()
    window.location.replace(path.startsWith('/login') ? path : safeNext(path))
  }, [client])
}
