import { ControlledLabel, Money, Text } from '@/lib/i18n/client'

import { Button } from '@/components/ui/button'
import React from 'react'
import Link from '@/app/ui/finance/FinanceLink'
import { recurringBills } from '../recurring-bills/list/data'
import { calculateRecurringBillsSummary } from '../recurring-bills/list/utils'
import type { PaymentSummary } from '@/lib/finance/types'

const RecurringBillsCard = ({title, value, color}: {
  title: string
  value: React.ReactNode
  color: string
}) => {
  return (
    <article className={`px-200 py-250 flex justify-between bg-background border-l-4 border-spacing-50 border-${color} rounded-none`}>
      <h3 className='text-preset-4 text-ink-muted'><ControlledLabel value={title} /></h3>
      <p className='text-preset-4-bold text-ink'>{value}</p>
    </article>
  )
}

export const RecurringBills = ({summary:actual}: {summary?:PaymentSummary}) => {
  const summary = actual ? {paid:{amount:actual.paid.totalAmount},upcoming:{amount:actual.pending.totalAmount},dueSoon:{amount:actual.dueSoon.totalAmount}} : calculateRecurringBillsSummary(recurringBills)
  return (
    <article className='grid gap-400 bg-card px-inset px-250 py-300 md:p-400'>
      <div className='flex flex-wrap justify-between gap-100'>
        <h2 className='text-preset-2 text-ink'><Text id="Recurring Bills" /></h2>
        <Button variant={'tertiary'} asChild><Link href="/finance/recurring-bills"><Text id="See Details" /></Link></Button>
      </div>
      <section className='grid gap-150'>
        <RecurringBillsCard
          title='Paid Bills'
          value={<Money value={summary.paid.amount} />}
          color='green'
        />
        <RecurringBillsCard
          title='Total Upcoming'
          value={<Money value={summary.upcoming.amount} />}
          color='yellow'
        />
        <RecurringBillsCard
          title='Due Soon'
          value={<Money value={summary.dueSoon.amount} />}
          color='cyan'
        />
      </section>
    </article>
  )
}
