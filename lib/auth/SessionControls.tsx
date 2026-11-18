'use client'
import { useEffect, useSyncExternalStore, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import Link from 'next/link'
import { SignOut } from '@phosphor-icons/react/dist/ssr'
import { Text, useI18n } from '@/lib/i18n/client'
import { api, ApiError } from '@/lib/api/client'
import { currentAccount, useAccessNavigation } from './client'
import type { Access } from './types'

const subscribe = () => () => {}
export function SessionControls({ access }: { access: Access }) {
  const { t } = useI18n()
  const ready = useSyncExternalStore(subscribe, () => true, () => false)
  const navigate = useAccessNavigation()
  const leaving = useRef(false)
  const account = useQuery({ queryKey: ['auth', 'me'], queryFn: currentAccount, enabled: access.kind === 'account', initialData: access.kind === 'account' ? { email: access.email } : undefined, retry: false, refetchOnWindowFocus: 'always' })
  useEffect(() => {
    if(account.error instanceof ApiError && account.error.status === 401) {
      if(!leaving.current) void navigate('/login?' + new URLSearchParams({ next: window.location.pathname + window.location.search }))
    } else if(account.error) toast.error(<Text id="Authentication is unavailable. Please retry."/>,{toastId:'auth-unavailable',role:'alert',autoClose:false})
    else toast.dismiss('auth-unavailable')
  }, [account.error, navigate])
  useEffect(() => {
    const hide = () => { document.documentElement.style.visibility = 'hidden' }
    const restore = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload()
      else document.documentElement.style.visibility = ''
    }
    window.addEventListener('pagehide', hide)
    window.addEventListener('pageshow', restore)
    return () => { window.removeEventListener('pagehide', hide); window.removeEventListener('pageshow', restore); document.documentElement.style.visibility = '' }
  }, [])
  const logout = useMutation({
    mutationFn: async () => {
      leaving.current = true
      if (access.kind === 'guest') await api.delete('guest')
      else await api.post('logout')
      await navigate('/login')
    },
    onError: () => { leaving.current = false; toast.error(<Text id="Could not sign out. Please retry."/>,{toastId:'logout-error',role:'alert',autoClose:false}) }, retry: false, networkMode: 'always', gcTime: 0,
  })
  return <div className="flex min-w-0 flex-col items-start gap-100 px-200 py-100 md:px-500 text-preset-5">
    <div className="flex items-center gap-200">
      <button type="button" aria-label={t('Log out')} title={t('Log out')} disabled={!ready || logout.isPending} className="flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-md text-grey-900 hover:bg-beige-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grey-900 disabled:opacity-50" onClick={() => logout.mutate()}>
        <SignOut size={24} aria-hidden="true" />
      </button>
      {access.kind === 'guest' && <Link href="/login" className="underline">{t('Login')}</Link>}
    </div>
  </div>
}
