import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { upstream } from '@/lib/api/upstream'
import { destination, safeNext, type Access, type SearchParams } from './types'

export const getAccess = cache(async (): Promise<Access> => {
  const jar = await cookies()
  if (jar.get('finance-guest')?.value === '1') return { kind: 'guest' }
  const session = jar.get('JSESSIONID')?.value
  if (!session) return { kind: 'anonymous' }
  try {
    const response = await upstream('me', { headers: { Cookie: 'JSESSIONID=' + encodeURIComponent(session) } })
    if (response.status === 401) return { kind: 'anonymous' }
    if (!response.ok) return { kind: 'unavailable' }
    const data = await response.json()
    return typeof data?.username === 'string' && data.username ? { kind: 'account', username: data.username } : { kind: 'unavailable' }
  } catch { return { kind: 'unavailable' } }
})
export async function requireAccess(path: string, params: SearchParams) {
  const access = await getAccess()
  if (access.kind === 'anonymous' || access.kind === 'unavailable') {
    const query = new URLSearchParams({ next: destination(path, params) })
    if (access.kind === 'unavailable') query.set('reason', 'unavailable')
    redirect('/login?' + query)
  }
  return access
}
export async function publicAccess(params: SearchParams) {
  const access = await getAccess()
  if (access.kind === 'account') redirect(safeNext(typeof params.next === 'string' ? params.next : undefined))
  return access
}
