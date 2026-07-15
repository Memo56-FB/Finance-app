'use client'

import { recurringBills } from './list/data'
import { calculateRecurringBillsSummary } from './list/utils'
import { RecurringBillsList } from './RecurringBillsList'
import { RecurringBillsOverview } from './RecurringBillsOverview'

export const RecurringBillsLayout = () => {
  const summary = calculateRecurringBillsSummary(recurringBills)

  return (
    <section className='grid gap-300 xl:grid-cols-[337px_1fr]'>
      <RecurringBillsOverview summary={summary} />
      <RecurringBillsList />
    </section>
  )
}
