import { Money, Text } from '@/lib/i18n/client'

import { Receipt } from '@phosphor-icons/react/dist/ssr'
import type { MoneyValue } from '@/lib/finance/money'

type RecurringBillsTotalProps = {
  total: { amount: MoneyValue }
}

export const RecurringBillsTotal = ({ total }: RecurringBillsTotalProps) => {
  return (
    <article className='bg-grey-900 rounded-xl px-250 py-300 grid gap-400 text-white'>
      <Receipt size={32} className='text-white' />
      <div className='grid gap-100'>
        <p className='text-preset-4'><Text id="Total Bills" /></p>
        <p className='text-preset-1 break-all'><Money value={total.amount} /></p>
      </div>
    </article>
  )
}
