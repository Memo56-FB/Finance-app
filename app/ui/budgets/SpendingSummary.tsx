import { ControlledLabel, Money, Text } from '@/lib/i18n/client'

import React from 'react'
import { BudgetChart } from '../BudgetChart'
import { Separator } from '@/components/ui/separator'
import { budgets } from './data'

const SpendingSummaryCard = ({ title, value, ofValue, color }: {
  title: string
  value: React.ReactNode
  ofValue: React.ReactNode
  color: string
}) => {
  return (
    <article className='flex flex-wrap justify-between gap-100'>
      <div className='flex gap-200'>
        <div className={`h-full rounded-lg bg-${color} w-1`}></div>
        <h3 className='text-preset-4 text-grey-500'><ControlledLabel value={title} /></h3>
      </div>
      <div className='flex gap-100 items-center'>
        <p className='text-preset-3 text-grey-900'>{value}</p>
        <p className='text-preset-5 text-grey-500'><Text id="of" />{' '}{ofValue}</p>
      </div>
    </article>
  )
}

export const SpendingSummary = () => {
  return (
    <article className="flex-1 px-250 pt-300 pb-200 md:pb-400 md:pr-400 bg-white rounded-xl md:grid md:grid-cols-[1fr_300px] md:items-center lg:grid-cols-1 col-span-1">
      <BudgetChart />
      <div className='grid gap-200'>
        <h2 className='text-preset-2 text-grey-900 mt-400 md:mt-300 mb-100'><Text id="Spending Summary" /></h2>
        {budgets.map((budget, index) => (
          <React.Fragment key={budget.title}>
            <SpendingSummaryCard color={budget.color} title={budget.title} value={<Money value={budget.spent} />} ofValue={<Money value={budget.ofValue} />} />
            {index < budgets.length - 1 && <Separator className='bg-grey-100' />}
          </React.Fragment>
        ))}
      </div>
    </article>
  )
}
