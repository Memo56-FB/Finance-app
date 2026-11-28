'use client'
import { validId } from '@/lib/api/finance-json'
import { RecurringRowsSkeleton, RecurringSummarySkeleton, recurringLayout, recurringListPanel, recurringTableColumns } from './RecurringLoading'
import { useQuery } from '@tanstack/react-query'
import { Check, Receipt } from '@phosphor-icons/react/dist/ssr'
import { RecurringBillsOverview } from '@/app/ui/recurring-bills/RecurringBillsOverview'
import { Money, useI18n } from '@/lib/i18n/client'
import { useFinance } from '@/lib/finance/AccountScope'
import { cents, decimal } from '@/lib/finance/money'
import { filtersFromURL } from '@/lib/finance/queries'
import { validMonth } from '@/lib/api/finance-path'
import type { PaymentSummary, RecurringPayment } from '@/lib/finance/types'
import { PaymentForm, RecurringForm } from './RecurringForms'
import { DeleteForm } from './DeleteForm'
import { Empty, financeDialog, NewDialog, PageHeader, QueryMessage, RowActions, usePaymentSummaryView, useRecurringView } from './common'
import { ListToolbar, PagedNavigation, useFinancialSearch } from './Transactions'
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
  const {t,recurringFrequency}=useI18n()
  const status={PENDING:'Pending',PAID:'Paid',VOID:'Void',NOT_SCHEDULED:'Not scheduled'} as const
  const paid=row.status === 'PAID'
  return <p className={`items-center gap-100 text-preset-5 ${paid ? 'text-green' : row.status === 'NOT_SCHEDULED' ? 'text-ink-muted' : 'text-red'} ${className}`}>
    {row.dueDate ? <time dateTime={row.dueDate}>{recurringFrequency(row.intervalMonths)} · {Number(row.dueDate.slice(8))}</time> : t('Not scheduled')}
    <span className={`grid h-3 w-3 place-items-center rounded-none text-[8px] leading-none text-ink ${paid ? 'bg-green' : 'bg-red'}`} aria-hidden="true">{paid ? <Check size={8} weight="bold"/> : '!'}</span><span className="sr-only">{t(status[row.status])}</span>
  </p>
}
function RecurringRow({row}:{row:RecurringPayment}) {
  const {t,money}=useI18n()
  const installmentCents = row.totalInstallments !== null ? cents(row.amount) : 0n
  return <article role="row" className={`relative grid grid-cols-[minmax(0,1fr)_auto_44px] gap-x-200 border-b border-line py-200 first:pt-0 last:border-b-0 last:pb-0 md:items-center ${recurringTableColumns}`}>
    <div role="cell" className="col-start-1 row-start-1 flex items-center gap-200 min-w-0 pl-[48px] md:pl-0">
      <span aria-hidden="true" className="absolute left-0 top-1/2 grid h-8 w-8 -translate-y-1/2 flex-none place-items-center rounded-none bg-panel text-ink md:static md:translate-y-0"><Receipt size={16} weight="fill"/></span>
      <div className="grid gap-50 min-w-0"><h2 className="text-preset-4-bold text-ink break-words [overflow-wrap:anywhere]">{row.name}</h2>
        <span className="sr-only">{row.categoryName} · {t(row.type === 'SUBSCRIPTION' ? 'Subscription' : 'Installments')} · {t('Paid installments')}: {row.paidInstallments}</span>
        {row.totalInstallments !== null && <span className="text-preset-5 text-ink-muted [overflow-wrap:anywhere]">
          {t('Installment')} {installmentNumber(row.firstDueDate,row.month)}/{row.totalInstallments}
          {' · '}{t('Paid')}: {money(decimal(installmentCents * BigInt(row.paidInstallments)))} {t('of')} {money(decimal(installmentCents * BigInt(row.totalInstallments)))}
        </span>}
      </div>
    </div>
    <div role="cell" className="col-start-1 row-start-2 min-w-0 pl-[48px] md:col-start-2 md:row-start-1 md:pl-0"><PaymentDueDate row={row} className="flex"/></div>
    <p role="cell" className={`col-start-2 row-span-2 row-start-1 self-center text-right md:col-start-3 md:row-span-1 text-preset-4-bold break-all ${row.status === 'PENDING' || row.status === 'VOID' ? 'text-red' : 'text-ink'}`}><Money value={row.status === 'PAID' && row.paidAmount !== null ? row.paidAmount : row.amount}/></p>
    <div role="cell" className="col-start-3 row-span-2 row-start-1 md:col-start-4 md:row-span-1">{validId(row.id) && <RowActions name={row.name} recordId={row.id} contentClassName={financeDialog} edit={<RecurringForm record={row}/>} remove={<DeleteForm resource="recurring-payments" id={row.id} name={row.name} recurring={row}/>} extra={['PENDING','VOID'].includes(row.status) ? {label:'Mark paid',content:<PaymentForm record={row}/>} : undefined}/>}</div>
  </article>
}
export function Recurring() {
  const search = useFinancialSearch()
  const {params}=search, {queries}=useFinance(), filters=filtersFromURL(params,true),query=useQuery(queries.recurring(filters))
  const month=params.get('month') ?? '',summary=useQuery(queries.paymentSummary(validMonth(month) ? month : undefined)),{t}=useI18n()
  const visibleSummary = usePaymentSummaryView(summary.data, validMonth(month) ? month : undefined)
  const items = useRecurringView(query.data, filters, summary.data?.month)
  return <>
    <PageHeader title="Recurring Bills"><NewDialog title="Add recurring payment" contentClassName={financeDialog}>{<RecurringForm/>}</NewDialog></PageHeader>
    <MonthControl effective={summary.data?.month} onMonthChange={value => search.applyFilter('month', value)}/>
    <section className={recurringLayout}>
      <div className="min-w-0 xl:self-start">
        <QueryMessage query={summary} fallback={visibleSummary ? null : <RecurringSummarySkeleton/>}/>
        {visibleSummary && <RecurringBillsOverview summary={summaryView(visibleSummary)}/>}
      </div>
      <section className={recurringListPanel}>
        <ListToolbar search={search}/>
        <QueryMessage query={query} fallback={items ? null : <RecurringRowsSkeleton/>}/>
        {items && <>
          {items.length ? <div role="table" aria-label={t('Recurring Bills')}>
            <div role="row" className={`sr-only md:not-sr-only md:mb-300 md:grid gap-200 border-b border-line pb-150 text-preset-5 text-ink-muted ${recurringTableColumns}`}>
              <span role="columnheader">{t('Bill Title')}</span>
              <span role="columnheader">{t('Due Date')}</span>
              <span role="columnheader" className="text-right">{t('Amount')}</span>
              <span role="columnheader" className="sr-only">{t('Actions')}</span>
            </div>
            <div role="rowgroup" className="grid">{items.map(row=><RecurringRow key={row.id} row={row}/>)}</div>
          </div> : <Empty label="No bills found."/>}
          {query.data && <PagedNavigation data={query.data} applyFilter={search.applyFilter}/>}
        </> }
      </section>
    </section>
  </>
}
