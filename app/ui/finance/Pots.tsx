'use client'
import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/Progress'
import { useFinance } from '@/lib/finance/AccountScope'
import { moneyRatio } from '@/lib/finance/money'
import { restorePot } from '@/lib/finance/services'
import type { Pot, PotDeletion } from '@/lib/finance/types'
import { Money, Percentage, useI18n } from '@/lib/i18n/client'
import { PotForm, PotMoneyForm } from './PotForms'
import { DeleteForm } from './DeleteForm'
import { Empty, errorLabel, financeDialog, NewDialog, PageHeader, panel, QueryMessage, RowActions } from './common'

export function undoDeadline(deletion:PotDeletion,receivedAt=Date.now()) {
  const server=deletion.serverTime ? Date.parse(deletion.serverTime) : receivedAt
  const remaining=Date.parse(deletion.restoreUntil)-(Number.isFinite(server) ? server : receivedAt)
  return receivedAt+Math.max(0,Math.min(10_000,remaining))
}
function UndoNotice({deletion,name,deadline,refresh,canAct,onDone}:{deletion:PotDeletion;name:string;deadline:number;refresh:()=>Promise<unknown>;canAct:()=>boolean;onDone:()=>void}) {
  const {t}=useI18n(),[expired,setExpired]=useState(()=>deadline <= Date.now())
  useEffect(()=>{const timer=window.setTimeout(()=>setExpired(true),Math.max(0,deadline-Date.now()));return ()=>window.clearTimeout(timer)},[deadline])
  const restore=useMutation({mutationFn:()=>restorePot(deletion.id),retry:false,onSuccess:()=>{void refresh();onDone()},onError:()=>{void refresh()}})
  return <div className="grid gap-150 min-w-0 break-words"><p>{t('Pot deleted.')} {name}</p>{expired ? <p>{t('The undo window has expired.')}</p> : <Button variant="secondary" onClick={()=>{if(Date.now() >= deadline)setExpired(true);else if(canAct() && !restore.isPending)restore.mutate()}} disabled={restore.isPending}>{t(restore.isPending ? 'Please wait…' : 'Undo')}</Button>}{restore.error && <p role="alert">{t('status' in restore.error && restore.error.status === 409 ? 'The undo window has expired.' : errorLabel(restore.error))}</p>}</div>
}
function PotCard({pot,onDeleted}:{pot:Pot;onDeleted:(result:PotDeletion)=>void}) {
  const {t}=useI18n(),progress=moneyRatio(pot.balance,pot.targetAmount)
  const moneyDialog='w-[calc(100%_-_40px)] max-w-[560px] md:max-w-[560px] px-250 py-250 md:p-400 grid gap-250'
  return <article className="bg-white rounded-xl px-250 py-300 md:p-300 grid gap-400 min-w-0"><header className="flex items-center justify-between gap-150"><div className="flex min-w-0 items-center gap-200"><span className="h-4 w-4 shrink-0 rounded-full" style={{backgroundColor:pot.color}}/><h2 className="text-preset-2 break-words [overflow-wrap:anywhere]">{pot.name}</h2></div><RowActions name={pot.name} recordId={pot.id} contentClassName={financeDialog} edit={<PotForm record={pot}/>} remove={<DeleteForm resource="savings-pots" id={pot.id} onDeleted={onDeleted}/>}/></header>
    <section className="grid gap-200"><div className="flex flex-wrap items-center justify-between gap-200"><p className="text-preset-4 text-grey-500">{t('Total Saved')}</p><p className="text-preset-1 break-all"><Money value={pot.balance}/></p></div><div className="grid grid-cols-2 gap-150"><Progress aria-label={`${pot.name} ${t('savings preview')}`} max={100} value={progress} color={pot.color} className="rounded-md h-2 [&::-webkit-progress-bar]:p-0 col-span-2"/><p className="text-preset-5-bold text-grey-500"><Percentage value={progress/100}/></p><p className="text-right text-preset-5 text-grey-500 break-all">{t('Target of')} <Money value={pot.targetAmount}/></p></div></section>
    <div className="grid grid-cols-2 gap-200"><NewDialog title="Amount to Add" heading={<>{t('Add to')} &apos;{pot.name}&apos;</>} description="Preview your savings after adding money." contentClassName={moneyDialog} buttonLabel="+Add Money" prefix={false} variant="secondary">{<PotMoneyForm record={pot} action="deposits"/>}</NewDialog><NewDialog title="Amount to Withdraw" heading={<>{t('Withdraw from')} &apos;{pot.name}&apos;</>} description="Preview your savings after withdrawing money." contentClassName={moneyDialog} buttonLabel="Withdraw" prefix={false} variant="secondary">{<PotMoneyForm record={pot} action="withdrawals"/>}</NewDialog></div>
  </article>
}
function showUndoNotice(deletion:PotDeletion,name:string,refresh:()=>Promise<unknown>,canAct:()=>boolean) {
  const receivedAt=Date.now(),deadline=undoDeadline(deletion,receivedAt)
  toast(({closeToast})=><UndoNotice deletion={deletion} name={name} deadline={deadline} refresh={refresh} canAct={canAct} onDone={closeToast}/>,{autoClose:Math.max(1,deadline-receivedAt)+4000,pauseOnHover:false,pauseOnFocusLoss:false})
}
export function Pots() {
  const {queries,refresh,canAct}=useFinance(),query=useQuery(queries.pots())
  return <><PageHeader title="Pots"><NewDialog title="Add New Pot" contentClassName={financeDialog}>{<PotForm/>}</NewDialog></PageHeader><QueryMessage query={query}/>{query.data && (query.data.items.length ? <section className="grid gap-300 xl:grid-cols-2">{query.data.items.map(pot=><PotCard key={pot.id} pot={pot} onDeleted={deletion=>showUndoNotice(deletion,pot.name,refresh,canAct)}/>)}</section> : <section className={panel}><Empty label="No pots yet."/></section>)}</>
}
