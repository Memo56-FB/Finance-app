import React from 'react'
import { SpendingSummary } from '@/app/ui/budgets/SpendingSummary'
import { BudgetsCard } from '@/app/ui/budgets/BudgetsCard'
import { CreateBudget } from '@/app/ui/budgets/CreateBudget'
import { budgets } from '@/app/ui/budgets/data'


const page = () => {
  return (
    <>
      <header className='flex justify-between'>
        <h1 className='text-preset-1 text-grey-900'>Budgets</h1>
        <CreateBudget />
      </header>
      <section className='grid gap-300 lg:grid-cols-2'>
        <SpendingSummary />
        {budgets.map((budget) => <BudgetsCard key={budget.title} {...budget} />)}
      </section>
    </>
  )
}

export default page
