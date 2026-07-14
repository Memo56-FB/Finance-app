import { RecurringBillsSummary } from './RecurringBillsSummary'
import { RecurringBillsTotal } from './RecurringBillsTotal'

export const RecurringBillsOverview = () => {
  return (
    <aside className='grid gap-150 md:grid-cols-2 xl:grid-cols-1 xl:self-start'>
      <RecurringBillsTotal />
      <RecurringBillsSummary />
    </aside>
  )
}
