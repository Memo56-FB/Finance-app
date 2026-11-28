import { CalendarDate, ControlledLabel, Money, Text } from '@/lib/i18n/client'

import React from 'react'

import type { Transaction } from './types'

export const TransactionTableDesktop = ({ transactions }: { transactions: readonly Transaction[] }) => {
  return (
    <table className='hidden md:grid gap-300'>
      <thead className='text-ink-muted py-150 border-b border-b-line'>
        <tr className='grid grid-cols-6 gap-400 text-left *:font-normal *:text-preset-5'>
          <th className='col-span-3'><Text id="Name" /></th>
          <th><Text id="Category" /></th>
          <th><Text id="Transaction Date" /></th>
          <th><Text id="Amount" /></th>
        </tr>
      </thead>
      <tbody className='[&>:not(:last-child)]:border-b [&>:not(:last-child)]:pb-200 [&>:not(:first-child)]:pt-200 text-preset-5'>
        {transactions.map((transaction) => (
          <tr className='grid grid-cols-6 gap-400 text-ink-muted border-b-line' key={transaction.id}>
            <td className='flex items-center gap-200 col-span-3'>
              <p className='text-preset-4-bold text-ink'>{transaction.name}</p>
            </td>
            <td><ControlledLabel value={transaction.category} /></td>
            <td><CalendarDate value={transaction.date} /></td>
            <td className='text-ink text-preset-4-bold'><Money signed value={transaction.amount} /></td>
          </tr>
        ))}
        {transactions.length === 0 && (
          <tr>
            <td className='py-300 text-center text-ink-muted' colSpan={6}><Text id="No transactions found." /></td>
          </tr>
        )}
      </tbody>
    </table>
  )
}
