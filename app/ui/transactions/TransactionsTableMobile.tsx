import React from 'react'
import { TransactionsCardTable } from './TransactionsCardTable'
import { Separator } from '@/components/ui/separator'

export const TransactionsTableMobile = () => {
  return (
    <div className='grid gap-200 md:hidden'>
      <TransactionsCardTable
        src='/profilePictures/Logo-1.jpg'
        recipient='Bravo Zen Spa'
        category='Personal Care'
        date='29 Aug 2024'
        amount='-$25.00'
      />
      <Separator className='bg-grey-100' />
    </div>
  )
}
