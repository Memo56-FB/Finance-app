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
      <section className='grid gap-200'>
        <Pots />
        <Transactions />
        <Budgets />
        <RecurringBills />
      </section>
    </>
  )
}

export default page