'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/Progress'
import { SpendingSummary } from '@/app/ui/budgets/SpendingSummary'
import { useFinance } from '@/lib/finance/AccountScope'
import { financeKey } from '@/lib/finance/queries'
import { recentExpenses } from '@/lib/finance/recent-expenses'
import { moneyRatio } from '@/lib/finance/money'
import { validMonth } from '@/lib/api/finance-path'
import { Money, useI18n } from '@/lib/i18n/client'
import type { Budget } from '@/lib/finance/types'
import { BudgetForm, DeleteForm } from './forms'
import { Empty, financeDialog, FormInput, NewDialog, PageHeader, panel, QueryMessage, RowActions } from './common'
import { TransactionRows, useFinancialURL } from './Transactions'

export function MonthControl({effective}:{effective?:string}) {
  const {params,update}=useFinancialURL()
  const currentMonth=effective ?? new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit'}).format(new Date())
  return <div className="flex"><FormInput label="Month" type="month" value={validMonth(params.get('month') ?? '') ? params.get('month')! : currentMonth} onChange={event=>update('month',event.target.value)}/></div>
}
function LatestExpenses({budget}:{budget:Budget}) {
  const {account}=useFinance(),{t}=useI18n()
  const query=useQuery({queryKey:[...financeKey(account),'budget-expenses',budget.categoryId,budget.month],queryFn:({signal})=>recentExpenses(budget.categoryId,budget.month,signal),staleTime:30_000})
  return <section className="grid gap-250 rounded-xl bg-beige-100 p-200"><header className="flex flex-wrap justify-between gap-100"><h3 className="text-preset-3">{t('Latest Spending')}</h3><Button variant="tertiary" asChild><Link href={'/finance/transactions?'+new URLSearchParams({category:budget.categoryId})}>{t('See All')}</Link></Button></header><QueryMessage query={query}/>{query.data && (query.data.length ? <TransactionRows rows={query.data} showCategory/> : <Empty label="No recent expenses."/>)}</section>
}
function BudgetCard({budget}:{budget:Budget}) {
  const {t}=useI18n()
  return <article className={`${panel} lg:col-start-2`}><header className="flex items-center justify-between gap-150"><div className="flex items-center gap-200 min-w-0"><span className="h-4 w-4 shrink-0 rounded-full" style={{backgroundColor:budget.color}}/><h2 className="text-preset-2 break-words [overflow-wrap:anywhere]">{budget.categoryName}</h2></div><RowActions name={budget.categoryName} recordId={budget.id} contentClassName={financeDialog} edit={done=><BudgetForm record={budget} onDone={done}/>} remove={done=><DeleteForm resource="budgets" id={budget.id} onDone={done}/>}/></header>
    <div className="grid gap-200"><p className="text-preset-4 text-grey-500 break-all">{t('Maximum of')} <Money value={budget.spendingLimit}/></p><Progress aria-label={`${budget.categoryName} ${t('spending')}`} max={100} value={moneyRatio(budget.spent,budget.spendingLimit)} color={budget.color}/>
    <dl className="grid grid-cols-2 gap-200"><div className="flex gap-200"><span className="h-full w-1 shrink-0 rounded-lg" style={{backgroundColor:budget.color}}/><div className="grid gap-50 min-w-0"><dt className="text-preset-5 text-grey-500">{t('Spent')}</dt><dd className="text-preset-4-bold break-all"><Money value={budget.spent}/></dd></div></div><div className="flex gap-200"><span className="h-full w-1 shrink-0 rounded-lg bg-beige-100"/><div className="grid gap-50 min-w-0"><dt className="text-preset-5 text-grey-500">{t('Free')}</dt><dd className="text-preset-4-bold break-all"><Money value={budget.available}/></dd></div></div></dl></div>
    {budget.limitReached && <p className="text-preset-5 text-red">{t('Budget limit reached.')} {t('Budget exceeded by')} <Money value={budget.exceededAmount}/></p>}<LatestExpenses budget={budget}/>
  </article>
}
export function Budgets() {
  const {queries}=useFinance(),{params}=useFinancialURL(),month=params.get('month') ?? '',query=useQuery(queries.budgets(validMonth(month) ? month : undefined))
  return <><PageHeader title="Budgets"><NewDialog title="Add New Budget" contentClassName={financeDialog}>{done=><BudgetForm onDone={done}/>}</NewDialog></PageHeader><MonthControl effective={query.data?.items[0]?.month}/><QueryMessage query={query}/>{query.data && (query.data.items.length ? <section className="grid grid-cols-1 gap-300 lg:grid-cols-2"><SpendingSummary items={query.data.items}/>{query.data.items.map(budget=><BudgetCard key={budget.id} budget={budget}/>)}</section> : <section className={panel}><Empty label="No budgets yet."/></section>)}</>
}
