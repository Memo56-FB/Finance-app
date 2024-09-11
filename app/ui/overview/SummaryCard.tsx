import React from 'react'

export const SummaryCard = ({title, value}: {
  title: string
  value: number | string
}) => {
  return (
    <article className='grid gap-150 p-250 md:p-300 bg-white rounded-xl'>
      <h3 className='text-preset-4 text-grey-500'>{title}</h3>
      <p className='text-preset-1 text-grey-900'>
        {value}
      </p>
    </article>
  )
}
export const SummaryCardCurrentBalance = ({title, value}: {
  title: string
  value: number | string
}) => {
  return (
    <article className='grid gap-150 p-250 md:p-300 bg-grey-900 text-white rounded-xl'>
      <h3 className='text-preset-4'>{title}</h3>
      <p className='text-preset-1'>
        {value}
      </p>
    </article>
  )
}
