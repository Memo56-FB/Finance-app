'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAccessNavigation } from '@/lib/auth/client'
import { financeKey, financeQueries } from './queries'
import type { BudgetWarning } from './types'
import { Money, useI18n } from '@/lib/i18n/client'

type Notice = { warnings:BudgetWarning[] }
const AccountContext=createContext<{ account:string; notify:(notice:Notice) => void } | null>(null)
export function AccountScope({ account, children }: { account: string; children: React.ReactNode }) {
  const client=useQueryClient()
  const navigate=useAccessNavigation()
  const { t }=useI18n()
  const [notice,setNotice]=useState<Notice | null>(null)
  useEffect(()=>{
    if(!notice)return
    const timer=window.setTimeout(()=>setNotice(null),8_000)
    return ()=>window.clearTimeout(timer)
  },[notice])
  useEffect(() => {
    const refresh=() => { if(document.visibilityState === 'visible') void client.invalidateQueries({queryKey:financeKey(account)}) }
    const expired=() => { void navigate('/login?'+new URLSearchParams({next:window.location.pathname+window.location.search})) }
    const timer=window.setInterval(refresh,60_000)
    window.addEventListener('finance-session-expired',expired)
    document.addEventListener('visibilitychange',refresh)
    return () => { window.clearInterval(timer);window.removeEventListener('finance-session-expired',expired);document.removeEventListener('visibilitychange',refresh) }
  },[account,client,navigate])
  return <AccountContext.Provider value={{account,notify:setNotice}}>
    {notice && <div role="status" className="rounded-lg bg-white p-200 text-preset-4 break-words">
      {t('Saved.')}{notice.warnings.map((warning,index) => <p key={`${warning.budgetId}-${warning.month}-${index}`}>
        {t('Budget limit reached.')} {t('Budget exceeded by')} <Money value={warning.exceededAmount} />
      </p>)}
    </div>}
    {children}
  </AccountContext.Provider>
}
export function useFinance() {
  const context=useContext(AccountContext)
  if(!context) throw new Error('AccountScope is required')
  const {account,notify}=context
  const client=useQueryClient()
  return { account, notify, queries:financeQueries(account), refresh:() => client.invalidateQueries({queryKey:financeKey(account)}) }
}
