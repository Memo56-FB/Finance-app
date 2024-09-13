import { Budgets } from '@/app/ui/overview/Budgets'
import { Pots } from '@/app/ui/overview/Pots'
import { RecurringBills } from '@/app/ui/overview/RecurringBills'
import { Summary } from '@/app/ui/overview/Summary'
import { Transactions } from '@/app/ui/overview/Transactions'
import React from 'react'

const page = () => {
  return (
    <>
      <h1 className='text-preset-1 text-grey-900'>Overview</h1>
      <Summary />
      <section className='grid gap-200 xl:gap-0 xl:grid-cols-[auto_auto] xl:gap-x-300'>
        <div className='flex flex-col gap-200 xl:gap-200'>
          <Pots />
          <Transactions />
        </div>
        <div className='flex flex-col gap-200 xl:gap-200'>
          <Budgets />
          <RecurringBills />
        </div>
      </section>
    </>
  )
}

export default page