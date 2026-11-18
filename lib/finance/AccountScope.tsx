'use client'
import { createContext, useContext, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useAccessNavigation } from '@/lib/auth/client'
import { financeKey, financeQueries } from './queries'
import type { BudgetWarning } from './types'
import { Money, Text } from '@/lib/i18n/client'

type Notice = { warnings:BudgetWarning[] }
const AccountContext=createContext<{ account:string; notify:(notice:Notice) => void } | null>(null)
export function AccountScope({ account, children }: { account: string; children: React.ReactNode }) {
  const client=useQueryClient()
  const navigate=useAccessNavigation()
  const notify=({warnings}:Notice)=>toast(<div className="min-w-0 break-words"><Text id="Saved."/>{warnings.map((warning,index)=><p key={`${warning.budgetId}-${warning.month}-${index}`}>
    <Text id="Budget limit reached."/> <Text id="Budget exceeded by"/> <Money value={warning.exceededAmount}/>
  </p>)}</div>,{type:warnings.length ? 'warning' : 'success'})
  useEffect(()=>()=>toast.dismiss(),[account])
  useEffect(() => {
    const refresh=() => { if(document.visibilityState === 'visible') void client.invalidateQueries({queryKey:financeKey(account)}) }
    const expired=() => { void navigate('/login?'+new URLSearchParams({next:window.location.pathname+window.location.search})) }
    const timer=window.setInterval(refresh,60_000)
    window.addEventListener('finance-session-expired',expired)
    document.addEventListener('visibilitychange',refresh)
    return () => { window.clearInterval(timer);window.removeEventListener('finance-session-expired',expired);document.removeEventListener('visibilitychange',refresh) }
  },[account,client,navigate])
  return <AccountContext.Provider value={{account,notify}}>{children}</AccountContext.Provider>
}
export function useFinance() {
  const context=useContext(AccountContext)
  if(!context) throw new Error('AccountScope is required')
  const {account,notify}=context
  const client=useQueryClient()
  return { account, notify, queries:financeQueries(account), refresh:() => client.invalidateQueries({queryKey:financeKey(account)}) }
}
