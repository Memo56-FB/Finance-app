'use client'
import { AmountsSkeleton, CardsSkeleton, FieldSkeleton, LoadingRegion, RowsSkeleton } from './Loading'
import Link from '@/app/ui/finance/FinanceLink'
import { endOfMonth, format, parseISO } from 'date-fns'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Budgets } from '@/app/ui/overview/Budgets'
import { Pots } from '@/app/ui/overview/Pots'
import { Transactions } from '@/app/ui/overview/Transactions'
import { RecurringBills } from '@/app/ui/overview/RecurringBills'
import { SummaryCard, SummaryCardCurrentBalance } from '@/app/ui/overview/SummaryCard'
import { useFinance } from '@/lib/finance/AccountScope'
import { CalendarDate, Money, useI18n } from '@/lib/i18n/client'
import { useEffect, useState } from 'react'
import { saveSettings } from '@/lib/finance/services'
import type { CutSettings } from '@/lib/finance/types'
import { FormInput, FormSelect, SaveForm, useDraftField, useSave } from './common'
import { useFieldError, validate } from './form-fields'
import { CalendarField } from './CalendarField'
import { NewDialog, PageHeader, panel, QueryMessage, useBudgetView, usePotView, useSettingsView, useSummaryView, useTransactionView, usePaymentSummaryView } from './common'
import type { Label } from './common'
import { financeQueries, recentTransactionFilters } from '@/lib/finance/queries'

function SectionLink({title,href}:{title:Label;href:string}) { const {t}=useI18n();return <header className="flex justify-between gap-100"><h2 className="text-preset-2">{t(title)}</h2><Button variant="tertiary" asChild><Link href={href}>{t('See Details')}</Link></Button></header> }
export function Overview() {
  const { account, phase, queries, refresh } = useFinance()
  const client = useQueryClient()
  useEffect(() => {
    if (phase !== 'active') return
    const options = financeQueries(account)
    const categories = options.categories()
    const transactions = options.transactions(recentTransactionFilters)
    if (!client.getQueryState(categories.queryKey)) void client.prefetchQuery(categories)
    if (!client.getQueryState(transactions.queryKey)) void client.prefetchQuery(transactions)
  }, [account, client, phase])
  const {t, language} = useI18n()
  const [selectedMonth, setSelectedMonth] = useState('')
  const month = selectedMonth || undefined
  const summary = useQuery(queries.summary(month))
  const visibleSummary = useSummaryView(summary.data, month)
  const settings = useQuery(queries.settings())
  const pots = useQuery(queries.pots(month))
  const visiblePots = usePotView(pots.data, month)
  const visibleSettings = useSettingsView(settings.data)
  const awaitingCut = !month && visibleSettings !== settings.data
  const transactions = useQuery(queries.transactions({ ...recentTransactionFilters, month }))
  const visibleTransactions = useTransactionView(transactions.data, { ...recentTransactionFilters, month })
  const budgets = useQuery(queries.budgets(month))
  const visibleBudgets = useBudgetView(budgets.data, month)
  const recurring = useQuery(queries.paymentSummary(month))
  const visibleRecurring = usePaymentSummaryView(recurring.data, month)
  const start = month ? month + '-01' : summary.data?.periodStart
  const end = month ? format(endOfMonth(parseISO(month)), 'yyyy-MM-dd') : summary.data?.periodEnd
  const periodLabel = month
    ? t('Period for {month}').replace('{month}', parseISO(month).toLocaleDateString(language, {month:'long', year:'numeric'}))
    : t('Reporting period')
  const wrongPeriod = month && summary.data && (summary.data.periodStart !== start || summary.data.periodEnd !== end)
  return <><PageHeader title="Overview">{visibleSettings && <NewDialog title="Configure period" prefix={false}>{<CutForm record={visibleSettings}/>}</NewDialog>}</PageHeader>
    <div className="flex flex-wrap items-end gap-150">
      <CalendarField label="Month" monthOnly value={selectedMonth} onChange={setSelectedMonth}/>
      {month && <Button variant="secondary" onClick={() => setSelectedMonth('')}>{t('Back to current period')}</Button>}
    </div>
    {start && end && !awaitingCut && <p aria-live="polite" className="text-preset-4 text-ink-muted">{periodLabel}: <CalendarDate value={start}/> – <CalendarDate value={end}/></p>}
    <QueryMessage query={settings} fallback={<FieldSkeleton/>}/><QueryMessage query={summary} fallback={awaitingCut ? null : <AmountsSkeleton/>}/>
    {awaitingCut && <LoadingRegion><AmountsSkeleton/></LoadingRegion>}
    {wrongPeriod && <div role="alert">
      <p>{t('The server returned a different period.')}</p>
      <Button variant="secondary" onClick={() => void refresh()}>{t('Reload data')}</Button>
    </div>}
    {!wrongPeriod && <>
      {visibleSummary && !awaitingCut && <section className="grid gap-150 md:gap-300 md:grid-cols-3">
        <SummaryCardCurrentBalance title={month ? 'Net balance' : 'Current Balance'} value={<Money value={visibleSummary.currentBalance}/>}/>
        <SummaryCard title="Income" value={<Money value={visibleSummary.income}/>}/>
        <SummaryCard title="Expenses" value={<Money value={visibleSummary.expenses}/>}/>
      </section>}
      <section className="grid grid-cols-1 gap-200 xl:gap-0 xl:grid-cols-[auto_auto] xl:gap-x-300">
        <div className="flex flex-col gap-200 min-w-0">
          <QueryMessage query={pots} fallback={visiblePots ? null : <CardsSkeleton count={1}/>}/>{visiblePots ? <Pots items={visiblePots.items} total={visiblePots.totalBalance}/> : <article className={panel}><SectionLink title="Pots" href="/finance/pots"/></article>}
          <QueryMessage query={transactions} fallback={visibleTransactions ? null : <div className={panel}><RowsSkeleton/></div>}/>{visibleTransactions ? <Transactions items={visibleTransactions.slice(0,4)}/> : <article className={panel}><SectionLink title="Transactions" href="/finance/transactions"/></article>}
        </div>
        <div className="flex flex-col gap-200 min-w-0">
          <QueryMessage query={budgets} fallback={visibleBudgets ? null : <CardsSkeleton count={0} chart/>}/>{visibleBudgets ? <Budgets items={visibleBudgets}/> : <article className={panel}><SectionLink title="Budgets" href="/finance/budgets"/></article>}
          <QueryMessage query={recurring} fallback={<AmountsSkeleton/>}/>{visibleRecurring ? <RecurringBills summary={visibleRecurring}/> : <article className={panel}><SectionLink title="Recurring Bills" href="/finance/recurring-bills"/></article>}
        </div>
      </section>
    </>}
  </>
}

function CutForm({ record }: { record: CutSettings }) {
  const { t } = useI18n()
  const { queries } = useFinance()
  const client = useQueryClient()
  const [frequency, setFrequency] = useDraftField('frequency', record.frequency)
  const [day, setDay] = useDraftField('startDay', String(record.startDay))
  const save = useSave<CutSettings>(() => {
    const startDay = Number(day)
    validate({ startDay: /^\d+$/.test(day) && startDay >= 1 && startDay <= 31 })
    return signal => saveSettings({ frequency, startDay }, signal)
  }, {
    resource: 'settings', id: 'settings', label: 'Configure period',
    intent: { resource: 'settings', action: 'save', value: { frequency: frequency === 'SEMIMONTHLY' ? frequency : 'MONTHLY', startDay: Number(day) } },
    draft: { frequency, startDay: day }, editor: <CutForm record={record} />,
    onConfirmed: settings => client.setQueryData(queries.settings().queryKey, settings),
  })
  const error = useFieldError(save.error)
  return <SaveForm save={save}>
    <FormSelect label="Frequency" value={frequency} onChange={setFrequency} options={[
      { value: 'MONTHLY', label: t('Monthly') },
      { value: 'SEMIMONTHLY', label: t('Semimonthly') },
    ]}/>
    <FormInput label="Start day" inputMode="numeric" value={day} onChange={e => setDay(e.target.value)} error={error('startDay')}/>
    <p className="text-preset-5">{t('Choose a day from 1 to 31.')}</p>
  </SaveForm>
}
