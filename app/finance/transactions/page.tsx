import { TransactionsTableMobile } from '@/app/ui/transactions/TransactionsTableMobile'
import { TransactionTableDesktop } from '@/app/ui/transactions/TransactionTableDesktop'
import React from 'react'

const page = () => {
  return (
    <>
      <h1 className='text-preset-1 text-grey-900'>Transactions</h1>
      <section className='bg-white mt-400 p-400 rounded-xl'>
        <TransactionTableDesktop />
        <TransactionsTableMobile />
      </section>
    </>
  )
}

export default page