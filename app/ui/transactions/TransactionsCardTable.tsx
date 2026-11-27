import { CalendarDate, ControlledLabel, Money } from '@/lib/i18n/client'

import React from 'react'
import type { Transaction } from './types'

export const TransactionsCardTable = ({ transaction }: { transaction: Transaction }) => {
  return (
    <article className='flex justify-between'>
      <div className='flex gap-150 items-center'>
        <div className='flex flex-col gap-50'>
          <p className='text-preset-4-bold text-ink'>{transaction.name}</p>
          <p className='text-preset-5 text-ink-muted'><ControlledLabel value={transaction.category} /></p>
        </div>
      </div>
      <div className='text-right flex flex-col gap-50'>
        <p className='text-preset-4-bold text-ink'><Money signed value={transaction.amount} /></p>
        <p className='text-preset-5 text-ink-muted'><CalendarDate value={transaction.date} /></p>
      </div>
    </article>
  )
}
