'use client'
import { CalendarField } from './CalendarField'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/Progress'
import { SpendingSummary } from '@/app/ui/budgets/SpendingSummary'
import { useFinance } from '@/lib/finance/AccountScope'
import { financeKey } from '@/lib/finance/queries'
import { recentExpenses } from '@/lib/finance/recent-expenses'
import { cents, moneyRatio } from '@/lib/finance/money'
import { validMonth } from '@/lib/api/finance-path'
import { Money, useI18n } from '@/lib/i18n/client'
import type { Budget } from '@/lib/finance/types'
import { useState } from 'react'
import { validId } from '@/lib/api/finance-json'
import { colorHex } from '@/lib/finance/colors'
import { validAmount } from '@/lib/finance/money'
import { saveRecord } from '@/lib/finance/services'
import { SaveForm, useSave } from './common'
import { AmountHelp, CategoryField, ColorField, useFieldError, validate } from './form-fields'
import { DeleteForm } from './DeleteForm'
import { Empty, financeDialog, FormInput, NewDialog, PageHeader, panel, QueryMessage, RowActions } from './common'
import { TransactionRows, useFinancialURL } from './Transactions'

export function MonthControl({effective,onMonthChange}:{effective?:string;onMonthChange?:(value:string)=>void}) {
  const {params,update}=useFinancialURL()
  const currentMonth=effective ?? new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit'}).format(new Date())
  return <div className="flex"><CalendarField label="Month" monthOnly value={validMonth(params.get('month') ?? '') ? params.get('month')! : currentMonth} onChange={value => onMonthChange ? onMonthChange(value) : update('month',value)}/></div>
}
function LatestExpenseRows({budget}:{budget:Budget}) {
  const { account, phase } = useFinance()
  const query = useQuery({
    queryKey: [...financeKey(account), 'budget-expenses', budget.categoryId, budget.month],
    queryFn: ({ signal }) => recentExpenses(budget.categoryId, budget.month, signal),
    staleTime: Infinity,
    gcTime: 0,
    enabled: phase === 'active',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
  return <>
    <QueryMessage query={query}/>
    {query.data && (query.data.length ? <TransactionRows rows={query.data} showCategory/> : <Empty label="No recent expenses."/>)}
  </>
}
function LatestExpenses({budget}:{budget:Budget}) {
  const { t } = useI18n()
  return <section className="grid gap-250 rounded-xl bg-beige-100 p-200">
    <header className="flex flex-wrap justify-between gap-100">
      <h3 className="text-preset-3">{t('Latest Spending')}</h3>
      <Button variant="tertiary" asChild><Link href={'/finance/transactions?'+new URLSearchParams({category:budget.categoryId})}>{t('See All')}</Link></Button>
    </header>
    {cents(budget.spent) === 0n ? <Empty label="No recent expenses."/> : <LatestExpenseRows budget={budget}/>}
  </section>
}
function BudgetCard({budget}:{budget:Budget}) {
  const {t}=useI18n()
  return <article className={`${panel} lg:col-start-2`}><header className="flex items-center justify-between gap-150"><div className="flex items-center gap-200 min-w-0"><span className="h-4 w-4 shrink-0 rounded-full" style={{backgroundColor:budget.color}}/><h2 className="text-preset-2 break-words [overflow-wrap:anywhere]">{budget.categoryName}</h2></div><RowActions name={budget.categoryName} recordId={budget.id} contentClassName={financeDialog} edit={<BudgetForm record={budget}/>} remove={<DeleteForm resource="budgets" id={budget.id}/>}/></header>
    <div className="grid gap-200"><p className="text-preset-4 text-grey-500 break-all">{t('Maximum of')} <Money value={budget.spendingLimit}/></p><Progress aria-label={`${budget.categoryName} ${t('spending')}`} max={100} value={moneyRatio(budget.spent,budget.spendingLimit)} color={budget.color}/>
    <dl className="grid grid-cols-2 gap-200"><div className="flex gap-200"><span className="h-full w-1 shrink-0 rounded-lg" style={{backgroundColor:budget.color}}/><div className="grid gap-50 min-w-0"><dt className="text-preset-5 text-grey-500">{t('Spent')}</dt><dd className="text-preset-4-bold break-all"><Money value={budget.spent}/></dd></div></div><div className="flex gap-200"><span className="h-full w-1 shrink-0 rounded-lg bg-beige-100"/><div className="grid gap-50 min-w-0"><dt className="text-preset-5 text-grey-500">{t('Free')}</dt><dd className="text-preset-4-bold break-all"><Money value={budget.available}/></dd></div></div></dl></div>
    {budget.limitReached && <p className="text-preset-5 text-red">{t('Budget limit reached.')} {t('Budget exceeded by')} <Money value={budget.exceededAmount}/></p>}<LatestExpenses budget={budget}/>
  </article>
}
export function Budgets() {
  const {queries}=useFinance(),{params}=useFinancialURL(),month=params.get('month') ?? '',query=useQuery(queries.budgets(validMonth(month) ? month : undefined))
  return <><PageHeader title="Budgets"><NewDialog title="Add New Budget" contentClassName={financeDialog}>{<BudgetForm/>}</NewDialog></PageHeader><MonthControl effective={query.data?.items[0]?.month}/><QueryMessage query={query}/>{query.data && (query.data.items.length ? <section className="grid grid-cols-1 gap-300 lg:grid-cols-2"><SpendingSummary items={query.data.items}/>{query.data.items.map(budget=><BudgetCard key={budget.id} budget={budget}/>)}</section> : <section className={panel}><Empty label="No budgets yet."/></section>)}</>
}

function BudgetForm({ record }: { record?: Budget }) {
  const { t } = useI18n()
  const [categoryId, setCategory] = useState(record?.categoryId ?? '')
  const [limit, setLimit] = useState(record?.spendingLimit ?? '')
  const [color, setColor] = useState(record?.color ?? colorHex.green)
  const save = useSave(async () => {
    validate({ categoryId: validId(categoryId), spendingLimit: validAmount(limit), color: /^#[\da-f]{6}$/i.test(color) })
    return saveRecord('budgets', { categoryId, spendingLimit: limit, color }, record?.id)
  })
  const error = useFieldError(save.error)
  return <SaveForm save={save} submitLabel={record ? 'Save Changes' : 'Add Budget'}>
    <p className="text-preset-4 text-grey-500">{t('Choose a category to set a spending budget.')}</p>
    <CategoryField value={categoryId} onChange={setCategory} error={error('categoryId')}/>
    <FormInput label="Maximum Spending" money inputMode="decimal" placeholder={t('e.g. 2000')} value={limit} onChange={e => setLimit(e.target.value)} error={error('spendingLimit')} required/>
    <AmountHelp/>
    <ColorField value={color} onChange={setColor}/>
  </SaveForm>
}
