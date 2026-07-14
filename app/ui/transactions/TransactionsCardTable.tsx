import Image from 'next/image'
import React from 'react'
import type { Transaction } from './types'
import { formatTransactionAmount, formatTransactionDate } from './utils'

export const TransactionsCardTable = ({ transaction }: { transaction: Transaction }) => {
  return (
    <article className='flex justify-between'>
      <div className='flex gap-150 items-center'>
        <Image
          alt='profile picture'
          src={transaction.avatarPath}
          width={32}
          height={32}
          className='rounded-full'
        />
        <div className='flex flex-col gap-50'>
          <p className='text-preset-4-bold text-grey-900'>{transaction.recipient}</p>
          <p className='text-preset-5 text-grey-500'>{transaction.category}</p>
        </div>
      </div>
      <div className='text-right flex flex-col gap-50'>
        <p className='text-preset-4-bold text-grey-900'>{formatTransactionAmount(transaction.amount)}</p>
        <p className='text-preset-5 text-grey-500'>{formatTransactionDate(transaction.date)}</p>
      </div>
    </article>
  )
}
