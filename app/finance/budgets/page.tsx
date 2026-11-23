import { FinanceHydration } from '@/lib/finance/server'
import { Budgets as LiveBudgets } from '@/app/ui/finance/Budgets'
import { requireAccess } from '@/lib/auth/server'
import type { PageProps } from '@/lib/auth/types'
import { Text } from '@/lib/i18n/client'

import React from 'react'
import { SpendingSummary } from '@/app/ui/budgets/SpendingSummary'
import { BudgetsCard } from '@/app/ui/budgets/BudgetsCard'
import { CreateBudget } from '@/app/ui/budgets/CreateBudget'
import { budgets } from '@/app/ui/budgets/data'

const page = async ({ searchParams }: PageProps) => {
  const params=await searchParams
  const access=await requireAccess('/finance/budgets', params)
  if(access.kind === 'account') return <FinanceHydration account={access.username} section="budgets" params={params}><LiveBudgets/></FinanceHydration>
  return (
    <>
      <header className='flex flex-wrap items-center justify-between gap-200'>
        <h1 className='text-preset-1 text-grey-900'><Text id="Budgets" /></h1>
        <CreateBudget />
      </header>
      <section className='grid grid-cols-1 gap-300 lg:grid-cols-2'>
        <SpendingSummary />
        {budgets.map((budget) => <BudgetsCard key={budget.title} {...budget} />)}
      </section>
    </>
  )
}

export default page
