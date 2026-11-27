'use client'
import { CardsSkeleton } from './Loading'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { validId } from '@/lib/api/finance-json'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/Progress'
import { useFinance } from '@/lib/finance/AccountScope'
import { moneyRatio } from '@/lib/finance/money'
import { restorePot } from '@/lib/finance/services'
import type { Pot, PotDeletion } from '@/lib/finance/types'
import { Money, Percentage, useI18n } from '@/lib/i18n/client'
import { PotForm, PotMoneyForm } from './PotForms'
import { DeleteForm } from './DeleteForm'
import { Empty, financeDialog, NewDialog, PageHeader, panel, QueryMessage, RowActions, usePotView, useSaveOperation } from './common'

export function undoDeadline(deletion:PotDeletion,receivedAt=Date.now()) {
  const server=deletion.serverTime ? Date.parse(deletion.serverTime) : receivedAt
  const remaining=Date.parse(deletion.restoreUntil)-(Number.isFinite(server) ? server : receivedAt)
  return receivedAt+Math.max(0,Math.min(10_000,remaining))
}
function UndoNotice({deletion,name,deadline,restore,onDone}:{deletion:PotDeletion;name:string;deadline:number;restore:()=>boolean;onDone:()=>void}) {
  const {t}=useI18n(),[expired,setExpired]=useState(()=>deadline <= Date.now())
  useEffect(()=>{const timer=window.setTimeout(()=>setExpired(true),Math.max(0,deadline-Date.now()));return ()=>window.clearTimeout(timer)},[deadline])
  return <div className="grid gap-150 min-w-0 break-words">
    <p>{t('Pot deleted.')} {name}</p>
    {expired ? <p>{t('The undo window has expired.')}</p> :
      <Button variant="secondary" onClick={() => {
        if (Date.now() >= deadline) setExpired(true)
        else if (restore()) onDone()
      }}>{t('Undo')}</Button>}
  </div>
}
function PotCard({pot,onDeleted}:{pot:Pot;onDeleted:(result:PotDeletion, receivedAt:number)=>void}) {
  const {t}=useI18n(),progress=moneyRatio(pot.balance,pot.targetAmount)
  const saved = validId(pot.id)
  const moneyDialog='w-[calc(100%_-_40px)] max-w-[560px] md:max-w-[560px] px-250 py-250 md:p-400 grid gap-250'
  return <article className="bg-card px-inset px-250 py-300 md:p-300 grid gap-400 min-w-0"><header className="flex items-center justify-between gap-150"><div className="flex min-w-0 items-center gap-200"><span className="h-4 w-4 shrink-0 rounded-none" style={{backgroundColor:pot.color}}/><h2 className="text-preset-2 break-words [overflow-wrap:anywhere]">{pot.name}</h2></div>{saved && <RowActions name={pot.name} recordId={pot.id} contentClassName={financeDialog} edit={<PotForm record={pot}/>} remove={<DeleteForm resource="savings-pots" id={pot.id} name={pot.name} onDeleted={onDeleted}/>}/>}</header>
    <section className="grid gap-200"><div className="flex flex-wrap items-center justify-between gap-200"><p className="text-preset-4 text-ink-muted">{t('Total Saved')}</p><p className="text-preset-1 break-all"><Money value={pot.balance}/></p></div><div className="grid grid-cols-2 gap-150"><Progress aria-label={`${pot.name} ${t('savings preview')}`} max={100} value={progress} color={pot.color} className="rounded-none h-2 [&::-webkit-progress-bar]:p-0 col-span-2"/><p className="text-preset-5-bold text-ink-muted"><Percentage value={progress/100}/></p><p className="text-right text-preset-5 text-ink-muted break-all">{t('Target of')} <Money value={pot.targetAmount}/></p></div></section>
    {saved && <div className="grid grid-cols-2 gap-200"><NewDialog title="Amount to Add" heading={<>{t('Add to')} &apos;{pot.name}&apos;</>} description="Preview your savings after adding money." contentClassName={moneyDialog} buttonLabel="+Add Money" prefix={false} variant="secondary">{<PotMoneyForm record={pot} action="deposits"/>}</NewDialog><NewDialog title="Amount to Withdraw" heading={<>{t('Withdraw from')} &apos;{pot.name}&apos;</>} description="Preview your savings after withdrawing money." contentClassName={moneyDialog} buttonLabel="Withdraw" prefix={false} variant="secondary">{<PotMoneyForm record={pot} action="withdrawals"/>}</NewDialog></div>}
  </article>
}
function showUndoNotice(deletion:PotDeletion, name:string, receivedAt:number, restore:()=>boolean) {
  const deadline=undoDeadline(deletion,receivedAt)
  toast(({closeToast})=><UndoNotice deletion={deletion} name={name} deadline={deadline} restore={restore} onDone={closeToast}/>,{autoClose:Math.max(1,deadline-Date.now())+4000,pauseOnHover:false,pauseOnFocusLoss:false})
}
export function Pots() {
  const {queries}=useFinance(),query=useQuery(queries.pots())
  const submit = useSaveOperation()
  const visible = usePotView(query.data)
  return <><PageHeader title="Pots"><NewDialog title="Add New Pot" contentClassName={financeDialog}>{<PotForm/>}</NewDialog></PageHeader><QueryMessage query={query} fallback={visible ? null : <CardsSkeleton showActions/>}/>{visible && (visible.items.length ? <section className="grid gap-300 xl:grid-cols-2">{visible.items.map(pot=><PotCard key={pot.id} pot={pot} onDeleted={(deletion, receivedAt) => showUndoNotice(deletion, pot.name, receivedAt, () => submit({
      resource: 'savings-pots', id: pot.id, label: 'Undo', name: pot.name,
      intent: { resource: 'savings-pots', action: 'restore', value: pot },
    }, signal => restorePot(deletion.id, signal)))}/>)}</section> : <section className={panel}><Empty label="No pots yet."/></section>)}</>
}
