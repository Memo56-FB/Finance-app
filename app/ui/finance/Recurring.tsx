'use client'
import { useQuery } from '@tanstack/react-query'
import { Check, Receipt } from '@phosphor-icons/react/dist/ssr'
import { RecurringBillsOverview } from '@/app/ui/recurring-bills/RecurringBillsOverview'
import { Money, useI18n } from '@/lib/i18n/client'
import { useFinance } from '@/lib/finance/AccountScope'
import { filtersFromURL } from '@/lib/finance/queries'
import { validMonth } from '@/lib/api/finance-path'
import type { PaymentSummary, RecurringPayment } from '@/lib/finance/types'
import { DeleteForm, PaymentForm, RecurringForm } from './forms'
import { Empty, financeDialog, NewDialog, PageHeader, QueryMessage, RowActions } from './common'
import { ListToolbar, PagedNavigation, useFinancialURL } from './Transactions'
import { MonthControl } from './Budgets'

export function installmentNumber(firstDueDate:string,month:string) {
  const [year,start]=firstDueDate.split('-').map(Number),[selectedYear,selectedMonth]=month.split('-').map(Number)
  return (selectedYear-year)*12+selectedMonth-start+1
}
function summaryView(summary:PaymentSummary) {
  const group=(value:PaymentSummary['paid'])=>({count:value.count,amount:value.totalAmount})
  return {total:group(summary.total),paid:group(summary.paid),upcoming:group(summary.pending),dueSoon:group(summary.dueSoon)}
}
function PaymentDueDate({row,className}:{row:RecurringPayment;className:string}) {
  const {t}=useI18n()
  const status={PENDING:'Pending',PAID:'Paid',VOID:'Void',NOT_SCHEDULED:'Not scheduled'} as const
  const paid=row.status === 'PAID'
  return <p className={`items-center gap-100 text-preset-5 ${paid ? 'text-green' : row.status === 'NOT_SCHEDULED' ? 'text-grey-500' : 'text-red'} ${className}`}>
    {row.dueDate ? <time dateTime={row.dueDate}>{t('Monthly')} {Number(row.dueDate.slice(8))}</time> : t('Not scheduled')}
    <span className={`grid h-3 w-3 place-items-center rounded-full text-[8px] leading-none text-white ${paid ? 'bg-green' : 'bg-red'}`} aria-hidden="true">{paid ? <Check size={8} weight="bold"/> : '!'}</span><span className="sr-only">{t(status[row.status])}</span>
  </p>
}
function RecurringRow({row}:{row:RecurringPayment}) {
  const {t}=useI18n()
  return <article className="grid grid-cols-[minmax(0,1fr)_auto_44px] gap-x-200 border-b border-grey-100 py-200 first:pt-0 last:border-b-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_160px_120px_44px] md:items-center">
    <div className="flex items-center gap-200 min-w-0">
      <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-grey-900 text-white"><Receipt size={16} weight="fill"/></span>
      <div className="grid gap-50 min-w-0"><h2 className="text-preset-4-bold text-grey-900 break-words [overflow-wrap:anywhere]">{row.name}</h2>
        <span className="sr-only">{row.categoryName} · {t(row.type === 'SUBSCRIPTION' ? 'Subscription' : 'Installments')} · {t('Paid installments')}: {row.paidInstallments}</span>
        {row.totalInstallments !== null && <span className="text-preset-5 text-grey-500">{t('Installment')} {installmentNumber(row.firstDueDate,row.month)}/{row.totalInstallments}</span>}
        <PaymentDueDate row={row} className="flex md:hidden"/>
      </div>
    </div>
    <PaymentDueDate row={row} className="hidden md:flex"/>
    <p className={`self-end text-right text-preset-4-bold break-all ${row.status === 'PENDING' || row.status === 'VOID' ? 'text-red' : 'text-grey-900'}`}><Money value={row.status === 'PAID' && row.paidAmount !== null ? row.paidAmount : row.amount}/></p>
    <RowActions name={row.name} recordId={row.id} contentClassName={financeDialog} edit={done=><RecurringForm record={row} onDone={done}/>} remove={done=><DeleteForm resource="recurring-payments" id={row.id} onDone={done}/>} extra={['PENDING','VOID'].includes(row.status) ? {label:'Mark paid',render:done=><PaymentForm record={row} onDone={done}/>} : undefined}/>
  </article>
}
export function Recurring() {
  const {queries}=useFinance(),{params}=useFinancialURL(),filters=filtersFromURL(params,true),query=useQuery(queries.recurring(filters))
  const month=params.get('month') ?? '',summary=useQuery(queries.paymentSummary(validMonth(month) ? month : undefined)),{t}=useI18n()
  return <>
    <PageHeader title="Recurring Bills"><NewDialog title="Add recurring payment" contentClassName={financeDialog}>{done=><RecurringForm onDone={done}/>}</NewDialog></PageHeader>
    <MonthControl effective={summary.data?.month}/><QueryMessage query={summary}/>
    <section className="grid gap-300 xl:grid-cols-[337px_1fr]">
      {summary.data && <RecurringBillsOverview summary={summaryView(summary.data)}/>}
      <section className="bg-white rounded-xl px-250 py-300 grid gap-300 md:px-400 min-w-0"><ListToolbar/><QueryMessage query={query}/>
        <div className="hidden md:grid grid-cols-[minmax(0,1fr)_160px_120px_44px] gap-200 border-b border-grey-100 pb-150 text-preset-5 text-grey-500"><p>{t('Bill Title')}</p><p>{t('Due Date')}</p><p className="text-right">{t('Amount')}</p><span className="sr-only">{t('Actions')}</span></div>
        {query.data && <><div className="grid">{query.data.items.length ? query.data.items.map(row=><RecurringRow key={row.id} row={row}/>) : <Empty label="No bills found."/>}</div><PagedNavigation data={query.data}/></>}
      </section>
    </section>
  </>
}
