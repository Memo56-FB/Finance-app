import { Receipt } from '@phosphor-icons/react/dist/ssr'
import { currencyFormatter } from './list/utils'

type RecurringBillsTotalProps = {
  total: { amount: number; count: number }
}

export const RecurringBillsTotal = ({ total }: RecurringBillsTotalProps) => {
  return (
    <article className='bg-grey-900 rounded-xl px-250 py-300 grid gap-400 text-white'>
      <Receipt size={32} className='text-white' />
      <div className='grid gap-100'>
        <p className='text-preset-4'>Total Bills</p>
        <p className='text-preset-1'>{currencyFormatter.format(total.amount)}</p>
      </div>
    </article>
  )
}
