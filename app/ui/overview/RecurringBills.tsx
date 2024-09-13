import { Button } from '@/components/ui/button'
import React from 'react'

const RecurringBillsCard = ({title, value, color}: {
  title: string
  value: number | string
  color: string
}) => {
  return (
    <article className={`px-200 py-250 flex justify-between bg-beige-100 border-l-4 border-spacing-50 border-${color} rounded-lg`}>
      <h3 className='text-preset-4 text-grey-500'>{title}</h3>
      <p className='text-preset-4-bold text-grey-900'>{value}</p>
    </article>
  )
}

export const RecurringBills = () => {
  return (
    <article className='grid gap-400 bg-white rounded-xl px-250 py-300 md:p-400'>
      <div className='flex justify-between'>
        <h2 className='text-preset-2 text-grey-900'>Recurring Bills</h2>
        <Button variant={'tertiary'}>See Details</Button>
      </div>
      <section className='grid gap-150'>
        <RecurringBillsCard
          title='Paid Billd'
          value={'$190.00'}
          color='green'
        />
        <RecurringBillsCard
          title='Total Upcoming'
          value={'$194.98'}
          color='yellow'
        />
        <RecurringBillsCard
          title='Due Soon'
          value={'$59.98'}
          color='cyan'
        />
      </section>
    </article>
  )
}
