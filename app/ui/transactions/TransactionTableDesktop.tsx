import Image from 'next/image'
import React from 'react'
import { formatTransactionAmount, formatTransactionDate } from './utils'
import type { Transaction } from './types'

export const TransactionTableDesktop = ({ transactions }: { transactions: readonly Transaction[] }) => {
  return (
    <table className='hidden md:grid gap-300'>
      <thead className='text-grey-500 py-150 border-b border-b-grey-100'>
        <tr className='grid grid-cols-6 gap-400 text-left *:font-normal *:text-preset-5'>
          <th className='col-span-3'>Recipient / Sender</th>
          <th>Category</th>
          <th>Transaction Date</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody className='[&>:not(:last-child)]:border-b [&>:not(:last-child)]:pb-200 [&>:not(:first-child)]:pt-200 text-preset-5'>
        {transactions.map((transaction) => (
          <tr className='grid grid-cols-6 gap-400 text-grey-500 border-b-grey-100' key={transaction.id}>
            <td className='flex items-center gap-200 col-span-3'>
              <Image
                className='rounded-full'
                src={transaction.avatarPath}
                alt={transaction.recipient}
                width={40}
                height={40}
              />
              <p className='text-preset-4-bold text-grey-900'>{transaction.recipient}</p>
            </td>
            <td>{transaction.category}</td>
            <td>{formatTransactionDate(transaction.date)}</td>
            <td className='text-grey-900 text-preset-4-bold'>{formatTransactionAmount(transaction.amount)}</td>
          </tr>
        ))}
        {transactions.length === 0 && (
          <tr>
            <td className='py-300 text-center text-grey-500' colSpan={6}>No transactions found.</td>
          </tr>
        )}
      </tbody>
    </table>
  )
}
