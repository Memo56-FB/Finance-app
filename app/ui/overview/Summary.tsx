import { Money } from '@/lib/i18n/client'
import React from 'react'
import { SummaryCard, SummaryCardCurrentBalance } from './SummaryCard'

export const Summary = () => {
  return (
    <section className='grid gap-150 md:gap-300 md:grid-cols-3'>
      <SummaryCardCurrentBalance
        title='Current Balance'
        value={<Money value={5113.75} />}
      />
      <SummaryCard
        title='Income'
        value={<Money value={3814.25} />}
      />
      <SummaryCard
        title='Expenses'
        value={<Money value={1700.50} />}
      />
    </section>
  )
}
