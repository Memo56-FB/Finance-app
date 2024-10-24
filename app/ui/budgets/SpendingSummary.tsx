import React from 'react'
import { BudgetChart } from '../BudgetChart'
import { Separator } from '@/components/ui/separator'

const SpendingSummaryCard = ({ title, value, ofValue, color }: {
  title: string
  value: number | string
  ofValue: number | string
  color: string
}) => {
  return (
    <article className='flex justify-between'>
      <div className='flex gap-200'>
        <div className={`h-full rounded-lg bg-${color} w-1`}></div>
        <h3 className='text-preset-4 text-grey-500'>{title}</h3>
      </div>
      <div className='flex gap-100 items-center'>
        <p className='text-preset-3 text-grey-900'>{value}</p>
        <p className='text-preset-5 text-grey-500'>of {ofValue}</p>
      </div>
    </article>
  )
}


export const SpendingSummary = () => {
  return (
    <article className="flex-1 px-250 pt-300 pb-200 bg-white rounded-xl">
      <BudgetChart />
      <h2 className='text-preset-2 text-grey-900 mt-400 mb-300 first:bg-red'>Sepending Summary</h2>
      <div className='grid gap-200'>
        <SpendingSummaryCard color='cyan' title='Bills' value={'$250.00'} ofValue={'$750.00'} />
        <Separator className='bg-grey-100' />
        <SpendingSummaryCard color='yellow' title='Dining Out' value={'$250.00'} ofValue={'$750.00'} />
        <Separator className='bg-grey-100' />
        <SpendingSummaryCard color='navy' title='Personal Care' value={'$250.00'} ofValue={'$750.00'} />
        <Separator className='bg-grey-100' />
        <SpendingSummaryCard color='green' title='Entertainment' value={'$250.00'} ofValue={'$750.00'} />
      </div>
    </article>
  )
}
