import { Text, useI18n } from '@/lib/i18n/client'

import { RecurringBillRow } from './RecurringBillRow'
import type { RecurringBill } from './types'

type RecurringBillsTableProps = {
  bills: RecurringBill[]
}

export const RecurringBillsTable = ({ bills }: RecurringBillsTableProps) => {
  const { t } = useI18n()
  if (!bills.length) return <p className="py-300 text-center text-preset-4 text-grey-500"><Text id="No bills found." /></p>
  return (
    <div role="table" aria-label={t("Recurring Bills")} className="grid gap-300">
      <div role='row' className='sr-only md:not-sr-only md:grid grid-cols-[1fr_160px_120px] gap-200 border-b border-grey-100 pb-150 text-preset-5 text-grey-500'>
        <span role="columnheader"><Text id="Bill Title" /></span>
        <span role="columnheader"><Text id="Due Date" /></span>
        <span role='columnheader' className='text-right'><Text id="Amount" /></span>
      </div>

      <div role="rowgroup" className="grid">
        {bills.map(bill => <RecurringBillRow bill={bill} key={`${bill.title}-${bill.dueDay}`} />)}
      </div>
    </div>
  )
}
