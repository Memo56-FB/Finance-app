'use client'
import Link from 'next/link'
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
import { useState } from 'react'
import { saveSettings } from '@/lib/finance/services'
import type { CutSettings } from '@/lib/finance/types'
import { FormInput, FormSelect, SaveForm, useSave } from './common'
import { useFieldError, validate } from './form-fields'
import { CalendarField } from './CalendarField'
import { NewDialog, PageHeader, panel, QueryMessage } from './common'
import type { Label } from './common'

function SectionLink({title,href}:{title:Label;href:string}) { const {t}=useI18n();return <header className="flex justify-between gap-100"><h2 className="text-preset-2">{t(title)}</h2><Button variant="tertiary" asChild><Link href={href}>{t('See Details')}</Link></Button></header> }
export function Overview() {
  const {queries, refresh} = useFinance()
  const {t, language} = useI18n()
  const [selectedMonth, setSelectedMonth] = useState('')
  const month = selectedMonth || undefined
  const summary = useQuery(queries.summary(month))
  const settings = useQuery(queries.settings())
  const pots = useQuery(queries.pots(month))
  const transactions = useQuery(queries.transactions({sort:'newest', size:4, page:0, month}))
  const budgets = useQuery(queries.budgets(month))
  const recurring = useQuery(queries.paymentSummary(month))
  const start = month ? month + '-01' : summary.data?.periodStart
  const end = month ? format(endOfMonth(parseISO(month)), 'yyyy-MM-dd') : summary.data?.periodEnd
  const periodLabel = month
    ? t('Period for {month}').replace('{month}', parseISO(month).toLocaleDateString(language, {month:'long', year:'numeric'}))
    : t('Reporting period')
  const wrongPeriod = month && summary.data && (summary.data.periodStart !== start || summary.data.periodEnd !== end)
  return <><PageHeader title="Overview">{settings.data && <NewDialog title="Configure period" prefix={false}>{<CutForm record={settings.data!}/>}</NewDialog>}</PageHeader>
    <div className="flex flex-wrap items-end gap-150">
      <CalendarField label="Month" monthOnly applyMonthOnNavigate value={selectedMonth} onChange={setSelectedMonth}/>
      {month && <Button variant="secondary" onClick={() => setSelectedMonth('')}>{t('Back to current period')}</Button>}
    </div>
    {start && end && <p aria-live="polite" className="text-preset-4 text-grey-500">{periodLabel}: <CalendarDate value={start}/> – <CalendarDate value={end}/></p>}
    <QueryMessage query={settings}/><QueryMessage query={summary}/>
    {wrongPeriod && <div role="alert">
      <p>{t('The server returned a different period.')}</p>
      <Button variant="secondary" onClick={() => void refresh()}>{t('Reload data')}</Button>
    </div>}
    {(!month || (summary.data && !wrongPeriod)) && <>
      {summary.data && <section className="grid gap-150 md:gap-300 md:grid-cols-3">
        <SummaryCardCurrentBalance title={month ? 'Net balance' : 'Current Balance'} value={<Money value={summary.data.currentBalance}/>}/>
        <SummaryCard title="Income" value={<Money value={summary.data.income}/>}/>
        <SummaryCard title="Expenses" value={<Money value={summary.data.expenses}/>}/>
      </section>}
      <section className="grid grid-cols-1 gap-200 xl:gap-0 xl:grid-cols-[auto_auto] xl:gap-x-300">
        <div className="flex flex-col gap-200 min-w-0">
          <QueryMessage query={pots}/>{pots.data ? <Pots items={pots.data.items} total={pots.data.totalBalance}/> : <article className={panel}><SectionLink title="Pots" href="/finance/pots"/></article>}
          <QueryMessage query={transactions}/>{transactions.data ? <Transactions items={transactions.data.items}/> : <article className={panel}><SectionLink title="Transactions" href="/finance/transactions"/></article>}
        </div>
        <div className="flex flex-col gap-200 min-w-0">
          <QueryMessage query={budgets}/>{budgets.data ? <Budgets items={budgets.data.items}/> : <article className={panel}><SectionLink title="Budgets" href="/finance/budgets"/></article>}
          <QueryMessage query={recurring}/>{recurring.data ? <RecurringBills summary={recurring.data}/> : <article className={panel}><SectionLink title="Recurring Bills" href="/finance/recurring-bills"/></article>}
        </div>
      </section>
    </>}
  </>
}

function CutForm({ record }: { record: CutSettings }) {
  const { t } = useI18n()
  const { queries } = useFinance()
  const client = useQueryClient()
  const [frequency, setFrequency] = useState<string>(record.frequency)
  const [day, setDay] = useState(String(record.startDay))
  const save = useSave(async () => {
    const startDay = Number(day)
    validate({ startDay: /^\d+$/.test(day) && startDay >= 1 && startDay <= 31 })
    return saveSettings({ frequency, startDay })
  }, {
    onConfirmed: settings => client.setQueryData(queries.settings().queryKey, settings),
    refreshAfterSave: () => client.invalidateQueries({ queryKey: queries.summary().queryKey, exact: true }),
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
