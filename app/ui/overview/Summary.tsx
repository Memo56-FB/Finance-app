import React from 'react'
import { SummaryCard, SummaryCardCurrentBalance } from './SummaryCard'

export const Summary = () => {
  return (
    <section className='grid gap-150 md:gap-300 md:grid-cols-3'>
      <SummaryCardCurrentBalance
        title='Current Balance'
        value={'$5,113.75'}
      />
      <SummaryCard
        title='Income'
        value={'$3,814.25'}
      />
      <SummaryCard
        title='Expenses'
        value={'$1,700.50'}
      />
    </section>
  )
}
