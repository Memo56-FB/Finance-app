import { CalendarDate, ControlledLabel, Money } from '@/lib/i18n/client'

import Image from 'next/image'
import React from 'react'
import type { Transaction } from './types'

export const TransactionsCardTable = ({ transaction }: { transaction: Transaction }) => {
  return (
    <article className='flex justify-between'>
      <div className='flex gap-150 items-center'>
        <Image
          alt=""
          src={transaction.avatarPath}
          width={32}
          height={32}
          className='rounded-full'
        />
        <div className='flex flex-col gap-50'>
          <p className='text-preset-4-bold text-grey-900'>{transaction.recipient}</p>
          <p className='text-preset-5 text-grey-500'><ControlledLabel value={transaction.category} /></p>
        </div>
      </div>
      <div className='text-right flex flex-col gap-50'>
        <p className='text-preset-4-bold text-grey-900'><Money signed value={transaction.amount} /></p>
        <p className='text-preset-5 text-grey-500'><CalendarDate value={transaction.date} /></p>
      </div>
    </article>
  )
}
