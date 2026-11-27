import { ControlledLabel } from '@/lib/i18n/client'

import React from 'react'

export const SummaryCard = ({title, value}: {
  title: string
  value: React.ReactNode
}) => {
  return (
    <article className='grid gap-150 p-250 md:p-300 bg-card px-inset'>
      <h3 className='text-preset-4 text-ink-muted'><ControlledLabel value={title} /></h3>
      <p className='text-preset-1 text-ink break-all'>
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
    <article className='grid gap-150 p-250 md:p-300 px-gradient px-bevel text-ink px-text-shadow'>
      <h3 className='text-preset-4'><ControlledLabel value={title} /></h3>
      <p className='text-preset-1 break-all'>
        {value}
      </p>
    </article>
  )
}
