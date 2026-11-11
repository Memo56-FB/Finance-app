import { Text } from '@/lib/i18n/client'

import { RecurringBillRow } from './RecurringBillRow'
import type { RecurringBill } from './types'

type RecurringBillsTableProps = {
  bills: RecurringBill[]
}

export const RecurringBillsTable = ({ bills }: RecurringBillsTableProps) => {
  return (
    <>
      <div className='hidden md:grid grid-cols-[1fr_160px_120px] gap-200 border-b border-grey-100 pb-150 text-preset-5 text-grey-500'>
        <p><Text id="Bill Title" /></p>
        <p><Text id="Due Date" /></p>
        <p className='text-right'><Text id="Amount" /></p>
      </div>

      <div className='grid'>
        {bills.length > 0 ? (
          bills.map((bill) => (
            <RecurringBillRow bill={bill} key={`${bill.title}-${bill.dueDay}`} />
          ))
        ) : (
          <p className='py-300 text-center text-preset-4 text-grey-500'><Text id="No bills found." /></p>
        )}
      </div>
    </>
  )
}
