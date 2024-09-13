import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import clsx from 'clsx'
import Image from 'next/image'
import React from 'react'

const TransactionCard = ({ src, name, value, date }: {
  src: string
  name: string
  value: string | number
  date: string
}) => {
  return (
    <article className='flex items-center justify-between'>
      <div className='flex gap-200 items-center'>
        <Image
          alt='profile picture'
          src={src}
          width={32}
          height={32}
          className='rounded-full'
        />
        <h2 className='text-preset-4-bold text-grey-900'>
          {name}
        </h2>
      </div>
      <div className='grid gap-100 text-right'>
        <p className={clsx(
          'text-preset-4-bold',
          value.toString().includes('-') ? 'text-grey-900' : 'text-green'
          )}
        >
          {value}
        </p>
        <p className='text-preset-5 text-grey-500'>{date}</p>
      </div>
    </article>
  )
}

export const Transactions = () => {
  return (
    <article className='grid gap-400 py-300 px-250 md:p-400 bg-white rounded-xl'>
      <div className="flex justify-between">
        <h2 className="text-preset-2 text-grey-900">Transactions</h2>
        <Button variant={'tertiary'}>See Details</Button>
      </div>
      <section className='grid gap-250'>
        <TransactionCard
          date='19 Aug 2024'
          name='Emma Richardson'
          src='/profilePictures/Logo-1.jpg'
          value={'+$75.50'}
        />
        <Separator className='bg-grey-100' />
        <TransactionCard
          date='19 Aug 2024'
          name='Savory Bites Bistro'
          src='/profilePictures/Logo-6.png'
          value={'-$55.50'}
        />
        <Separator className='bg-grey-100' />
        <TransactionCard
          date='18 Aug 2024'
          name='Daniel Carter'
          src='/profilePictures/Person-1.jpg'
          value={'-$42.30'}
        />
        <Separator className='bg-grey-100'/>
        <TransactionCard
          date='17 Aug 2024'
          name='Sun Park'
          src='/profilePictures/Person-10.jpg'
          value={'+$120.00'}
        />
      </section>
    </article>
  )
}
