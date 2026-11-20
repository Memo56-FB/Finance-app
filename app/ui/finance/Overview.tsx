'use client'
import Link from 'next/link'
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
import { NewDialog, PageHeader, panel, QueryMessage } from './common'
import type { Label } from './common'

function SectionLink({title,href}:{title:Label;href:string}) { const {t}=useI18n();return <header className="flex justify-between gap-100"><h2 className="text-preset-2">{t(title)}</h2><Button variant="tertiary" asChild><Link href={href}>{t('See Details')}</Link></Button></header> }
export function Overview() {
  const {queries}=useFinance(),{t}=useI18n(),summary=useQuery(queries.summary()),settings=useQuery(queries.settings()),pots=useQuery(queries.pots()),transactions=useQuery(queries.transactions({sort:'newest',size:4,page:0})),budgets=useQuery(queries.budgets()),recurring=useQuery(queries.paymentSummary())
  return <><PageHeader title="Overview">{settings.data && <NewDialog title="Configure period" prefix={false}>{<CutForm record={settings.data!}/>}</NewDialog>}</PageHeader><QueryMessage query={settings}/><QueryMessage query={summary}/>
    {summary.data && <><p className="text-preset-4 text-grey-500">{t('Reporting period')}: <CalendarDate value={summary.data.periodStart}/> – <CalendarDate value={summary.data.periodEnd}/></p><section className="grid gap-150 md:gap-300 md:grid-cols-3"><SummaryCardCurrentBalance title="Current Balance" value={<Money value={summary.data.currentBalance}/>}/><SummaryCard title="Income" value={<Money value={summary.data.income}/>}/><SummaryCard title="Expenses" value={<Money value={summary.data.expenses}/>}/></section></>}
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
