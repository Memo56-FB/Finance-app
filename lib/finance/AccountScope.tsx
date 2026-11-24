'use client'

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { ApiError, bindFinanceSession } from '@/lib/api/client'
import { currentAccount, leavingSession, sessionChannel, useAccessNavigation } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Money, Text } from '@/lib/i18n/client'
import { financeKey, financeQueries } from './queries'
import type { BudgetWarning } from './types'

type Phase = 'checking' | 'active' | 'read-only' | 'unavailable' | 'leaving'
type Notice = { warnings: BudgetWarning[] }
type AccountSession = {
  account: string
  phase: Phase
  canAct: () => boolean
  concealed: boolean
  operationSignal: () => AbortSignal | undefined
  whenVerified: () => Promise<boolean>
  retry: () => void
  notify: (notice: Notice) => void
}
const AccountContext = createContext<AccountSession | null>(null)

export function AccountScope({ account, sessionTag, children }: { account: string; sessionTag?: string; children: React.ReactNode }) {
  const client = useQueryClient()
  const navigate = useAccessNavigation()
  const [phase, setPhase] = useState<Phase>('checking')
  const access = useRef<Phase>('checking')
  const verification = useRef<ReturnType<typeof Promise.withResolvers<boolean>> | null>(null)
  const retryCheck = useRef<() => void>(() => {})
  const operationController = useRef<AbortController | null>(null)
  const canAct = () => access.current === 'active'

  useLayoutEffect(() => bindFinanceSession(sessionTag), [sessionTag])
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const key = financeKey(account)
    const controller = new AbortController()
    operationController.current = controller
    let checking = false
    let checkAgain = false
    let mustHide = false
    let nextExpiryCheck = 0

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

    async function verify(mode: 'initial' | 'routine' | 'sensitive') {
      if (controller.signal.aborted) return
      if (mode === 'sensitive') {
        mustHide = true
        toast.dismiss()
        setHidden(true)
        access.current = 'checking'
        setPhase('checking')
        verification.current ??= Promise.withResolvers<boolean>()
        void client.cancelQueries({ queryKey: key })
        if (checking) checkAgain = true
      }
      if (checking) return
      const canKeepCache = mode === 'routine' && !mustHide
      checking = true
      verification.current ??= Promise.withResolvers<boolean>()
      try {
        do {
          checkAgain = false
          const identity = await currentAccount(controller.signal, sessionTag).catch(error => {
            if (error instanceof ApiError && error.status === 401) return null
            throw error
          })
          if (controller.signal.aborted) return
          if (checkAgain) continue
          if (identity?.username !== account) {
            // A fresh server render distinguishes guest mode from an expired session.
            leave()
            void navigate(window.location.pathname + window.location.search)
            return
          }
        } while (checkAgain)
        mustHide = false
        setHidden(false)
        access.current = 'active'
        setPhase('active')
        verification.current?.resolve(true)
        verification.current = null
      } catch {
        if (!controller.signal.aborted) {
          if (checkAgain) queueMicrotask(() => void verify('sensitive'))
          else {
            access.current = canKeepCache && !mustHide ? 'read-only' : 'unavailable'
            if (access.current === 'unavailable') setHidden(true)
            setPhase(access.current)
          }
        }
      } finally {
        checking = false
      }
    }

    const expired = () => {
      const now = performance.now()
      if (now < nextExpiryCheck) return
      nextExpiryCheck = now + 60_000
      void verify('sensitive')
    }
    const navigation = () => { if (access.current === 'active') void verify('routine') }
    const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel(sessionChannel) : null
    if (channel) channel.onmessage = event => {
      if (event.data !== 'changed') return
      nextExpiryCheck = 0
      void verify('sensitive')
    }

    retryCheck.current = () => void verify(access.current === 'read-only' ? 'routine' : 'sensitive')
    window.addEventListener('finance-navigation', navigation)
    window.addEventListener(leavingSession, leave)
    window.addEventListener('finance-session-expired', expired)
    void verify('initial')
    return () => {
      stop()
      channel?.close()
      window.removeEventListener('finance-navigation', navigation)
      window.removeEventListener(leavingSession, leave)
      window.removeEventListener('finance-session-expired', expired)
    }
  }, [account, sessionTag, client, navigate])

  if (phase === 'leaving') return null
  return <AccountContext.Provider value={{
    account, phase, canAct, concealed: hidden,
    operationSignal: () => operationController.current?.signal,
    whenVerified: () => canAct() ? Promise.resolve(true) : (verification.current?.promise ?? Promise.resolve(false)),
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
    <SessionRetry />
    <div className={hidden ? 'hidden' : 'contents'} inert={phase === 'checking' || hidden}>{children}</div>
  </AccountContext.Provider>
}

export function SessionRetry() {
  const session = useContext(AccountContext)
  if (session?.phase !== 'unavailable' && session?.phase !== 'read-only') return null
  return <div className="grid gap-100">
    <p role="alert"><Text id="Authentication is unavailable. Please retry."/></p>
    <Button type="button" variant="secondary" onClick={session.retry}><Text id="Retry session check"/></Button>
  </div>
}

export function useAccountSession() { return useContext(AccountContext) }

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
