'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { ApiError } from '@/lib/api/client'
import { currentAccount, leavingSession, sessionChannel, useAccessNavigation } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Money, Text } from '@/lib/i18n/client'
import { financeKey, financeQueries } from './queries'
import type { BudgetWarning } from './types'

type Phase = 'checking' | 'active' | 'unavailable' | 'leaving'
type Notice = { warnings: BudgetWarning[] }
type AccountSession = {
  account: string
  phase: Phase
  canAct: () => boolean
  whenVerified: () => Promise<boolean>
  retry: () => void
  notify: (notice: Notice) => void
}
const AccountContext = createContext<AccountSession | null>(null)

export function AccountScope({ account, children }: { account: string; children: React.ReactNode }) {
  const client = useQueryClient()
  const navigate = useAccessNavigation()
  const [phase, setPhase] = useState<Phase>('checking')
  const access = useRef<Phase>('checking')
  const verification = useRef<ReturnType<typeof Promise.withResolvers<boolean>> | null>(null)
  const retryCheck = useRef<() => void>(() => {})
  const canAct = () => access.current === 'active'

  useEffect(() => {
    const key = financeKey(account)
    const controller = new AbortController()
    let checking = false
    let checkAgain = false
    let checkedAfter401 = false

    function stop() {
      access.current = 'leaving'
      controller.abort()
      verification.current?.resolve(false)
      verification.current = null
      toast.dismiss()
    }

    function leave() {
      if (access.current === 'leaving') return
      stop()
      setPhase('leaving')
    }

    async function verify(initial = false) {
      if (controller.signal.aborted || checking) return
      checking = true
      access.current = 'checking'
      if (!initial) setPhase('checking')
      verification.current ??= Promise.withResolvers<boolean>()
      try {
        await client.cancelQueries({ queryKey: key })
        do {
          checkAgain = false
          const identity = await currentAccount(controller.signal).catch(error => {
            if (error instanceof ApiError && error.status === 401) return null
            throw error
          })
          if (controller.signal.aborted) return
          if (checkAgain) continue
          if (identity?.email !== account) {
            // A fresh server render distinguishes guest mode from an expired session.
            leave()
            void navigate(window.location.pathname + window.location.search)
            return
          }
        } while (checkAgain)
        if (!initial) void client.invalidateQueries({ queryKey: key, refetchType: 'none' })
        access.current = 'active'
        setPhase('active')
        verification.current?.resolve(true)
        verification.current = null
      } catch {
        if (!controller.signal.aborted) {
          access.current = 'unavailable'
          setPhase('unavailable')
          if (checkAgain) queueMicrotask(() => void verify())
        }
      } finally {
        checking = false
      }
    }

    const visible = () => {
      if (document.visibilityState !== 'visible') return
      checkedAfter401 = false
      void verify()
    }
    const expired = () => {
      if (checkedAfter401) return
      checkedAfter401 = true
      void verify()
    }
    const refresh = () => {
      if (access.current === 'active' && document.visibilityState === 'visible') {
        void client.invalidateQueries({ queryKey: key })
      }
    }
    const timer = window.setInterval(refresh, 60_000)
    const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel(sessionChannel) : null
    if (channel) channel.onmessage = event => {
      if (event.data !== 'changed') return
      checkedAfter401 = false
      if (checking) checkAgain = true
      else void verify()
    }

    retryCheck.current = () => void verify()
    window.addEventListener(leavingSession, leave)
    window.addEventListener('finance-session-expired', expired)
    document.addEventListener('visibilitychange', visible)
    window.addEventListener('focus', visible)
    void verify(true)
    return () => {
      stop()
      window.clearInterval(timer)
      channel?.close()
      document.removeEventListener('visibilitychange', visible)
      window.removeEventListener('focus', visible)
      window.removeEventListener(leavingSession, leave)
      window.removeEventListener('finance-session-expired', expired)
    }
  }, [account, client, navigate])

  if (phase === 'leaving') return null
  return <AccountContext.Provider value={{
    account, phase, canAct,
    whenVerified: () => verification.current?.promise ?? Promise.resolve(canAct()),
    retry: () => retryCheck.current(),
    notify: ({ warnings }) => {
      if (!canAct()) return
      toast(<div className="min-w-0 break-words"><Text id="Saved."/>{warnings.map((warning, index) =>
        <p key={`${warning.budgetId}-${warning.month}-${index}`}>
          <Text id="Budget limit reached."/> <Text id="Budget exceeded by"/> <Money value={warning.exceededAmount}/>
        </p>
      )}</div>, { type: warnings.length ? 'warning' : 'success' })
    },
  }}>
    {phase === 'unavailable' && <SessionRetry />}
    <div className="contents" inert={phase !== 'active'}>{children}</div>
  </AccountContext.Provider>
}

export function SessionRetry() {
  const session = useContext(AccountContext)
  if (session?.phase !== 'unavailable') return null
  return <div className="grid gap-100">
    <p role="alert"><Text id="Authentication is unavailable. Please retry."/></p>
    <Button type="button" variant="secondary" onClick={session.retry}><Text id="Retry session check"/></Button>
  </div>
}

export function useFinance() {
  const context = useContext(AccountContext)
  if (!context) throw new Error('AccountScope is required')
  const client = useQueryClient()
  const { account, canAct, phase } = context
  return {
    ...context,
    queries: financeQueries(account, undefined, phase === 'active'),
    refresh: () => canAct() ? client.invalidateQueries({ queryKey: financeKey(account) }) : Promise.resolve(),
  }
}
