import { RecurringBillsList } from './RecurringBillsList'
import { RecurringBillsOverview } from './RecurringBillsOverview'

export const RecurringBillsLayout = () => {
  return (
    <section className='grid gap-300 xl:grid-cols-[337px_1fr]'>
      <RecurringBillsOverview />
      <RecurringBillsList />
    </section>
  )
}
