'use client'
import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/Progress'
import { useFinance } from '@/lib/finance/AccountScope'
import { moneyRatio } from '@/lib/finance/money'
import { restorePot } from '@/lib/finance/services'
import type { Pot, PotDeletion } from '@/lib/finance/types'
import { Money, Percentage, useI18n } from '@/lib/i18n/client'
import { DeleteForm, PotForm, PotMoneyForm } from './forms'
import { Empty, errorLabel, financeDialog, NewDialog, PageHeader, panel, QueryMessage, RowActions } from './common'

export function undoDeadline(deletion:PotDeletion,receivedAt=Date.now()) {
  const server=deletion.serverTime ? Date.parse(deletion.serverTime) : receivedAt
  const remaining=Date.parse(deletion.restoreUntil)-(Number.isFinite(server) ? server : receivedAt)
  return receivedAt+Math.max(0,Math.min(10_000,remaining))
}
function UndoNotice({deletion,onDone}:{deletion:PotDeletion;onDone:()=>void}) {
  const {refresh}=useFinance(),{t}=useI18n(),[deadline]=useState(()=>undoDeadline(deletion)),[expired,setExpired]=useState(()=>deadline <= Date.now())
  useEffect(()=>{const timer=window.setTimeout(()=>setExpired(true),Math.max(0,deadline-Date.now()));return ()=>window.clearTimeout(timer)},[deadline])
  const restore=useMutation({mutationFn:()=>restorePot(deletion.id),retry:false,onSuccess:()=>{void refresh();onDone()},onError:()=>{void refresh()}})
  return <div role="status" className="flex flex-wrap items-center gap-200 rounded-lg bg-white p-200 text-preset-4"><p>{t('Pot deleted.')}</p>{expired ? <p>{t('The undo window has expired.')}</p> : <Button variant="secondary" onClick={()=>{if(!restore.isPending)restore.mutate()}} disabled={restore.isPending}>{t(restore.isPending ? 'Please wait…' : 'Undo')}</Button>}{restore.error && <p role="alert">{t('status' in restore.error && restore.error.status === 409 ? 'The undo window has expired.' : errorLabel(restore.error))}</p>}</div>
}
function PotCard({pot,onDeleted}:{pot:Pot;onDeleted:(result:PotDeletion)=>void}) {
  const {t}=useI18n(),progress=moneyRatio(pot.balance,pot.targetAmount)
  const moneyDialog='w-[calc(100%_-_40px)] max-w-[560px] md:max-w-[560px] px-250 py-250 md:p-400 grid gap-250'
  return <article className="bg-white rounded-xl px-250 py-300 md:p-300 grid gap-400 min-w-0"><header className="flex items-center justify-between gap-150"><div className="flex min-w-0 items-center gap-200"><span className="h-4 w-4 shrink-0 rounded-full" style={{backgroundColor:pot.color}}/><h2 className="text-preset-2 break-words [overflow-wrap:anywhere]">{pot.name}</h2></div><RowActions name={pot.name} recordId={pot.id} contentClassName={financeDialog} edit={done=><PotForm record={pot} onDone={done}/>} remove={done=><DeleteForm resource="savings-pots" id={pot.id} onDone={done} onDeleted={onDeleted}/>}/></header>
    <section className="grid gap-200"><div className="flex flex-wrap items-center justify-between gap-200"><p className="text-preset-4 text-grey-500">{t('Total Saved')}</p><p className="text-preset-1 break-all"><Money value={pot.balance}/></p></div><div className="grid grid-cols-2 gap-150"><Progress aria-label={`${pot.name} ${t('savings preview')}`} max={100} value={progress} color={pot.color} className="rounded-md h-2 [&::-webkit-progress-bar]:p-0 col-span-2"/><p className="text-preset-5-bold text-grey-500"><Percentage value={progress/100}/></p><p className="text-right text-preset-5 text-grey-500 break-all">{t('Target of')} <Money value={pot.targetAmount}/></p></div></section>
    <div className="grid grid-cols-2 gap-200"><NewDialog title="Amount to Add" heading={<>{t('Add to')} &apos;{pot.name}&apos;</>} description="Preview your savings after adding money." contentClassName={moneyDialog} buttonLabel="+Add Money" prefix={false} variant="secondary">{done=><PotMoneyForm record={pot} action="deposits" onDone={done}/>}</NewDialog><NewDialog title="Amount to Withdraw" heading={<>{t('Withdraw from')} &apos;{pot.name}&apos;</>} description="Preview your savings after withdrawing money." contentClassName={moneyDialog} buttonLabel="Withdraw" prefix={false} variant="secondary">{done=><PotMoneyForm record={pot} action="withdrawals" onDone={done}/>}</NewDialog></div>
  </article>
}
export function Pots() {
  const {queries}=useFinance(),query=useQuery(queries.pots()),[deletion,setDeletion]=useState<PotDeletion | null>(null)
  return <><PageHeader title="Pots"><NewDialog title="Add New Pot" contentClassName={financeDialog}>{done=><PotForm onDone={done}/>}</NewDialog></PageHeader>{deletion && <UndoNotice key={deletion.id+deletion.restoreUntil} deletion={deletion} onDone={()=>setDeletion(null)}/>}<QueryMessage query={query}/>{query.data && (query.data.items.length ? <section className="grid gap-300 xl:grid-cols-2">{query.data.items.map(pot=><PotCard key={pot.id} pot={pot} onDeleted={setDeletion}/>)}</section> : <section className={panel}><Empty label="No pots yet."/></section>)}</>
}
