import React from 'react'
import { TransactionsCardTable } from './TransactionsCardTable'
import { Separator } from '@/components/ui/separator'
import type { Transaction } from './types'

export const TransactionsTableMobile = ({ transactions }: { transactions: readonly Transaction[] }) => {
  return (
    <div className='grid gap-200 md:hidden'>
      {transactions.map((transaction, index) => (
        <React.Fragment key={transaction.id}>
          <TransactionsCardTable transaction={transaction} />
          {index < transactions.length - 1 && <Separator className='bg-grey-100' />}
        </React.Fragment>
      ))}
      {transactions.length === 0 && (
        <p className='py-300 text-center text-grey-500'>No transactions found.</p>
      )}
    </div>
  )
}
