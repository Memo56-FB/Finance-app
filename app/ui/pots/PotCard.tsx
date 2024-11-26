import { Circle } from '@phosphor-icons/react/dist/ssr'
import React from 'react'
import { EditDeleteDropdown } from './EditDeleteDropdown'
import { Progress } from '@/components/ui/Progress'
import { Button } from '@/components/ui/button'

export const PotCard = () => {
  return (
    <article className='bg-white rounded-xl px-250 py-300 grid gap-400'>
      <header className='flex justify-between'>
        <div className='flex gap-200 items-center'>
          <Circle size={16} weight="fill" className='fill-green' />
          <h1 className='text-preset-2 text-grey-900'>Savings</h1>
        </div>
        <EditDeleteDropdown />
      </header>
      <section className='grid gap-200'>
        <div className='flex justify-between items-center'>
          <p className='text-preset-4 text-grey-500'>Total Saved</p>
          <p className='text-preset-1 text-grey-900'>$159.00</p>
        </div>
        <div className='grid justify-between items-center grid-cols-2 gap-150'>
          <Progress color='green' max={100} value={7.95} className='rounded-md h-2 [&::-webkit-progress-bar]:p-0 col-span-2' />
          <p className='text-preset-5-bold text-grey-500'>7.95%</p>
          <p className='text-right text-preset-5 text-grey-500'>Target of $3,000</p>
        </div>
      </section>
      <div className='grid grid-cols-2 gap-200'>
        <Button variant={'secondary'}>
          +Add Money
        </Button>
        <Button variant={'secondary'}>
          Withdraw
        </Button>
      </div>
    </article>
  )
}
