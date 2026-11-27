'use client'
import { useEffect, useSyncExternalStore, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { SignOut } from '@phosphor-icons/react/dist/ssr'
import { Text, useI18n } from '@/lib/i18n/client'
import { api } from '@/lib/api/client'
import { announceSessionChange, sessionChannel, useAccessNavigation } from './client'
import type { Access } from './types'

const subscribe = () => () => {}
export function SessionControls({ access }: { access: Pick<Access, 'kind'> }) {
  const { t } = useI18n()
  const ready = useSyncExternalStore(subscribe, () => true, () => false)
  const navigate = useAccessNavigation()
  const leaving = useRef(false)
  useEffect(() => {
    if (access.kind !== 'guest' || typeof BroadcastChannel !== 'function') return
    const channel = new BroadcastChannel(sessionChannel)
    channel.onmessage = event => {
      if (event.data === 'changed' && !leaving.current) {
        void navigate(window.location.pathname + window.location.search)
      }
    }
    return () => channel.close()
  }, [access.kind, navigate])
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
      announceSessionChange()
      await navigate('/login')
    },
    onError: () => { leaving.current = false; toast.error(<Text id="Could not sign out. Please retry."/>,{toastId:'logout-error',role:'alert',autoClose:false}) }, retry: false, networkMode: 'always', gcTime: 0,
  })
  return <div className="flex min-w-0 flex-col items-start gap-100 px-200 py-100 md:px-500 text-preset-5">
    <div className="flex items-center gap-200">
      <button type="button" aria-label={t('Log out')} title={t('Log out')} aria-busy={logout.isPending} disabled={!ready || logout.isPending} className="flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-md text-ink hover:bg-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50" onClick={() => logout.mutate()}>
        {logout.isPending ? <Skeleton className="size-6"/> : <SignOut size={24} aria-hidden="true" />}
      </button>
      {access.kind === 'guest' && <Link href="/login" className="underline">{t('Login')}</Link>}
    </div>
  </div>
}
