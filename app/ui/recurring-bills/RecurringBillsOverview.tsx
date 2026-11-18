import { RecurringBillsSummary } from './RecurringBillsSummary'
import { RecurringBillsTotal } from './RecurringBillsTotal'
import type { RecurringBillsSummaryView } from './RecurringBillsSummary'

type RecurringBillsOverviewProps = {
  summary: RecurringBillsSummaryView
}

export const RecurringBillsOverview = ({ summary }: RecurringBillsOverviewProps) => {
  return (
    <aside className='grid gap-150 md:grid-cols-2 xl:grid-cols-1 xl:self-start'>
      <RecurringBillsTotal total={summary.total} />
      <RecurringBillsSummary summary={summary} />
    </aside>
  )
}
