import { Money } from '@/lib/i18n/client'

import { cn } from '@/lib/utils'
import { BillDueDate } from './BillDueDate'
import type { RecurringBill } from './types'

type RecurringBillRowProps = {
  bill: RecurringBill
}

export const RecurringBillRow = ({ bill }: RecurringBillRowProps) => {
  const BillIcon = bill.icon
  const isDue = bill.status === 'due'

  return (
    <article role='row' className='relative grid grid-cols-[minmax(0,1fr)_auto] gap-x-200 border-b border-grey-100 py-200 first:pt-0 last:border-b-0 last:pb-0 md:grid-cols-[1fr_160px_120px] md:items-center'>
      <div role='cell' className='col-start-1 row-start-1 flex min-w-0 items-center gap-200 pl-[48px] md:pl-0'>
        <span aria-hidden='true' className={cn('absolute left-0 top-1/2 -translate-y-1/2 md:static md:translate-y-0 grid h-8 w-8 flex-none place-items-center rounded-full text-white', bill.iconClassName)}>
          <BillIcon size={16} weight='fill' />
        </span>
        <div className='grid gap-50'>
          <h2 className='text-preset-4-bold text-grey-900'>{bill.title}</h2>
        </div>
      </div>

      <div role='cell' className='col-start-1 row-start-2 pl-[48px] md:col-start-2 md:row-start-1 md:pl-0'><BillDueDate bill={bill} /></div>

      <p role='cell' className={cn('col-start-2 row-span-2 row-start-1 self-end md:col-start-3 md:row-span-1 text-right text-preset-4-bold text-grey-900', isDue && 'text-red')}>
        <Money value={bill.amount} />
      </p>
    </article>
  )
}
