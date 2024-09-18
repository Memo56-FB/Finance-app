import Image from 'next/image'
import React from 'react'

export const TransactionsCardTable = ({src, recipient, category, date, amount}: {
  src: string
  recipient: string
  category: string
  date: string
  amount: string | number
}) => {
  return (
    <article className='flex justify-between'>
      <div className='flex gap-150 items-center'>
        <Image
          alt='profile picture'
          src={src}
          width={32}
          height={32}
          className='rounded-full'
        />
        <div className='flex flex-col gap-50'>
          <p className='text-preset-4-bold grey-900'>{recipient}</p>
          <p className='text-preset-5 text-grey-500'>{category}</p>
        </div>
      </div>
      <div className='text-right flex flex-col gap-50'>
        <p className='text-preset-4-bold text-grey-900'>{amount}</p>
        <p className='text-preset-5 text-grey-500'>{date}</p>
      </div>
    </article>
  )
}
