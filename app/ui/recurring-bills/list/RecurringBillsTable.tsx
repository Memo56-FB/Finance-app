import { RecurringBillRow } from './RecurringBillRow'
import type { RecurringBill } from './types'

type RecurringBillsTableProps = {
  bills: RecurringBill[]
}

export const RecurringBillsTable = ({ bills }: RecurringBillsTableProps) => {
  return (
    <>
      <div className='hidden md:grid grid-cols-[1fr_160px_120px] gap-200 border-b border-grey-100 pb-150 text-preset-5 text-grey-500'>
        <p>Bill Title</p>
        <p>Due Date</p>
        <p className='text-right'>Amount</p>
      </div>

      <div className='grid'>
        {bills.length > 0 ? (
          bills.map((bill) => (
            <RecurringBillRow bill={bill} key={`${bill.title}-${bill.dueDate}`} />
          ))
        ) : (
          <p className='py-300 text-center text-preset-4 text-grey-500'>
            No bills found.
          </p>
        )}
      </div>
    </>
  )
}
