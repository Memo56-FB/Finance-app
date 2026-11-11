import { ControlledLabel } from '@/lib/i18n/client'

import React from 'react'

export const SummaryCard = ({title, value}: {
  title: string
  value: React.ReactNode
}) => {
  return (
    <article className='grid gap-150 p-250 md:p-300 bg-white rounded-xl'>
      <h3 className='text-preset-4 text-grey-500'><ControlledLabel value={title} /></h3>
      <p className='text-preset-1 text-grey-900'>
        {value}
      </p>
    </article>
  )
}
export const SummaryCardCurrentBalance = ({title, value}: {
  title: string
  value: React.ReactNode
}) => {
  return (
    <article className='grid gap-150 p-250 md:p-300 bg-grey-900 text-white rounded-xl'>
      <h3 className='text-preset-4'><ControlledLabel value={title} /></h3>
      <p className='text-preset-1'>
        {value}
      </p>
    </article>
  )
}
