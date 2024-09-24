import { TransactionsTableMobile } from '@/app/ui/transactions/TransactionsTableMobile'
import { TransactionTableDesktop } from '@/app/ui/transactions/TransactionTableDesktop'
import { InputSearch } from '@/components/ui/InputSearch'
import { ResponsiveSelect } from '@/components/ui/ResponsiveSelect'
import { Funnel, SortAscending } from '@phosphor-icons/react/dist/ssr'
import React from 'react'

const page = () => {
  return (
    <>
      <h1 className='text-preset-1 text-grey-900'>Transactions</h1>
      <section className='bg-white mt-400 px-250 py-300 md:p-400 rounded-xl'>
        <div className='flex gap-300 items-center justify-between mb-300'>
          <InputSearch type='text' placeholder='Search transaction' />
          <div className='flex gap-300'>
            <ResponsiveSelect label='Sort By' options={['Latest', 'Profile', 'Billing', 'Team', 'Subscription']}>
              <SortAscending weight='fill' size={20} className='text-grey-900' />
            </ResponsiveSelect>
            <ResponsiveSelect label='Category' options={['All Transactions', 'Entertainment', 'Bills', 'Groceries', 'Dining Out', 'Transportation', 'Personal Care']}>   
              <Funnel weight='fill' size={20} className='text-grey-900' />
            </ResponsiveSelect>
          </div>
        </div>
        <TransactionTableDesktop />
        <TransactionsTableMobile />
      </section>
    </>
  )
}

export default page