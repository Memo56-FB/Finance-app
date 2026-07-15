import { RecurringBillsSummary } from './RecurringBillsSummary'
import { RecurringBillsTotal } from './RecurringBillsTotal'
import type { RecurringBillsSummary as RecurringBillsSummaryData } from './list/utils'

type RecurringBillsOverviewProps = {
  summary: RecurringBillsSummaryData
}

export const RecurringBillsOverview = ({ summary }: RecurringBillsOverviewProps) => {
  return (
    <aside className='grid gap-150 md:grid-cols-2 xl:grid-cols-1 xl:self-start'>
      <RecurringBillsTotal total={summary.total} />
      <RecurringBillsSummary summary={summary} />
    </aside>
  )
}
