import { Button } from '@/components/ui/button'
import React from 'react'
import { SpendingSummary } from '@/app/ui/budgets/SpendingSummary'
import { BudgetsCard } from '@/app/ui/budgets/BudgetsCard'


const page = () => {
  return (
    <>
      <header className='flex justify-between'>
        <h1 className='text-preset-1 text-grey-900'>Budgets</h1>
        <Button className='flex text-preset-4 text-white'>
          + Add New Budget
        </Button>
      </header>
      <section className='grid gap-300'>
        <SpendingSummary />
        <BudgetsCard
          color='green'
          free={'$500.00'}
          latest={{name: 'Papa Software', date: '20 Aug 2024', value: '$250.00'}}
          ofValue={750.00}
          spent={250.00}
          title='Entertainment'
        />
        <BudgetsCard
          color='cyan'
          free={'$8'}
          latest={{name: 'Papa Software', date: '20 Aug 2024', value: '$250.00'}}
          ofValue={75}
          spent={67}
          title='Entertainment'
        />
        <BudgetsCard
          color='yellow'
          free={'$50.00'}
          latest={{name: 'Papa Software', date: '20 Aug 2024', value: '$250.00'}}
          ofValue={50.00}
          spent={25.00}
          title='Entertainment'
        />
        <BudgetsCard
          color='navy'
          free={'$35.00'}
          latest={{name: 'Papa Software', date: '20 Aug 2024', value: '$250.00'}}
          ofValue={100.00}
          spent={65.00}
          title='Entertainment'
        />
      </section>
    </>
  )
}

export default page