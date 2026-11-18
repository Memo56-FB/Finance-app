import { CalendarDate, Money, Text } from '@/lib/i18n/client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import clsx from 'clsx'
import React from 'react'
import Link from 'next/link'

const TransactionCard = ({ name, value, date }: {
  name: string
  value: number
  date: string
}) => {
  return (
    <article className='flex items-center justify-between'>
      <div className='flex gap-200 items-center'>
        <h2 className='text-preset-4-bold text-grey-900'>
          {name}
        </h2>
      </div>
      <div className='grid gap-100 text-right'>
        <p className={clsx(
          'text-preset-4-bold',
          value < 0 ? 'text-grey-900' : 'text-green'
          )}
        >
          <Money signed value={value} />
        </p>
        <p className='text-preset-5 text-grey-500'><CalendarDate value={date} /></p>
      </div>
    </article>
  )
}

export const Transactions = () => {
  return (
    <article className='grid gap-400 py-300 px-250 md:p-400 bg-white rounded-xl'>
      <div className="flex flex-wrap justify-between gap-100">
        <h2 className="text-preset-2 text-grey-900"><Text id="Transactions" /></h2>
        <Button variant={'tertiary'} asChild><Link href="/finance/transactions"><Text id="See Details" /></Link></Button>
      </div>
      <section className='grid gap-250'>
        <TransactionCard
          date='2024-08-19T00:00:00Z'
          name='Ticket refund'
          value={75.50}
        />
        <Separator className='bg-grey-100' />
        <TransactionCard
          date='2024-08-19T00:00:00Z'
          name='Dinner'
          value={-55.50}
        />
        <Separator className='bg-grey-100' />
        <TransactionCard
          date='2024-08-18T00:00:00Z'
          name='Bus pass'
          value={-42.30}
        />
        <Separator className='bg-grey-100'/>
        <TransactionCard
          date='2024-08-17T00:00:00Z'
          name='Grocery refund'
          value={120.00}
        />
      </section>
    </article>
  )
}
