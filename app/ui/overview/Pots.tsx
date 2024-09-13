import { Button } from '@/components/ui/button'
import { TipJar } from '@phosphor-icons/react/dist/ssr'
import React from 'react'


const PotMiniCard = ({ color, title, value }: {
  color: string
  title: string
  value: number | string
}) => {
  return (
    <article className='relative flex gap-200'>
      <div aria-hidden className={`h-full w-1 bg-${color} rounded-lg`} />
      <div className='grid gap-50'>
        <h3 className='text-preset-5 text-grey-500'>{title}</h3>
        <p className='text-preset-4-bold text-grey-900'>{value}</p>
      </div>
    </article>
  )
}


export const Pots = () => {
  return (
    <article className='py-300 px-250 md:p-400 grid gap-250 bg-white rounded-xl'>
      <div className='flex justify-between'>
        <h2 className='text-preset-2 text-grey-900'>Pots</h2>
        <Button variant={'tertiary'}>See Details</Button>
      </div>
      <div className='grid gap-250 md:grid-cols-2'>
        <article className='p-200 flex gap-200 items-center bg-beige-100 rounded-xl'>
          <TipJar className='text-green' size={40} />
          <div className='gap-[11px] grid'>
            <h3 className='text-preset-4 text-grey-500'>Total Saved</h3>
            <p className='text-preset-1 text-grey-900'>$850</p>
          </div>
        </article>
        <section className='grid grid-cols-2 gap-200'>
          <PotMiniCard
            color='green'
            title='Savings'
            value='$159'
          />
          <PotMiniCard
            color='cyan'
            title='Gift'
            value='$40'
          />
          <PotMiniCard
            color='navy'
            title='Concert Ticket'
            value='$110'
          />
          <PotMiniCard
            color='yellow'
            title='New Laptop'
            value='$10'
          />

        </section>
      </div>
    </article>
  )
}
