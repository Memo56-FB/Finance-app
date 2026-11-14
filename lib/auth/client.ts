'use client'
import { useCallback } from 'react'
import { api, clearCsrf, ApiError } from '@/lib/api/client'
import { useQueryClient } from '@tanstack/react-query'
import { safeNext, type Account } from './types'

export async function currentAccount(): Promise<Account> {
  const { data } = await api.get('me')
  if (typeof data?.email !== 'string' || !data.email) throw new ApiError(502)
  return { email: data.email }
}
export function useAccessNavigation() {
  const client = useQueryClient()
  return useCallback(async (path: string) => {
    await client.cancelQueries()
    client.clear()
    clearCsrf()
    window.location.replace(path.startsWith('/login') ? path : safeNext(path))
  }, [client])
}
