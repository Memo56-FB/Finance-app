import { cn } from '@/lib/utils'
import { BillDueDate } from './BillDueDate'
import type { RecurringBill } from './types'
import { currencyFormatter } from './utils'

type RecurringBillRowProps = {
  bill: RecurringBill
}

export const RecurringBillRow = ({ bill }: RecurringBillRowProps) => {
  const BillIcon = bill.icon
  const isDue = bill.status === 'due'

  return (
    <article className='grid grid-cols-[auto_1fr_auto] gap-x-200 border-b border-grey-100 py-200 first:pt-0 last:border-b-0 last:pb-0 md:grid-cols-[1fr_160px_120px] md:items-center'>
      <div className='flex items-center gap-200'>
        <span className={cn('grid h-8 w-8 flex-none place-items-center rounded-full text-white', bill.iconClassName)}>
          <BillIcon size={16} weight='fill' />
        </span>
        <div className='grid gap-50'>
          <h2 className='text-preset-4-bold text-grey-900'>{bill.title}</h2>
          <BillDueDate bill={bill} className='md:hidden' />
        </div>
      </div>

      <BillDueDate bill={bill} className='hidden md:flex' />

      <p className={cn('self-end text-right text-preset-4-bold text-grey-900', isDue && 'text-red')}>
        {currencyFormatter.format(bill.amount)}
      </p>
    </article>
  )
}
