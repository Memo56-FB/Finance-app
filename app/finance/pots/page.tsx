import { CreatePot } from '@/app/ui/pots/CreatePot'
import { PotCard } from '@/app/ui/pots/PotCard'
import React from 'react'

const page = () => {
  return (
    <>
      <header className='flex justify-between'>
        <h1 className='text-preset-1 text-grey-900'>Pots</h1>
        <CreatePot />
      </header>
      <section className='grid gap-300 xl:grid-cols-2'>
        <PotCard color='green' title='Savings' totalSaved={159.00} targetOf={2000} />
        <PotCard color='navy' title='Concert Ticket' totalSaved={110.00} targetOf={150} />
        <PotCard color='cyan' title='Gift' totalSaved={40.00} targetOf={60} />
        <PotCard color='yellow' title='New Laptop' totalSaved={10.00} targetOf={1000} />
        <PotCard color='purple' title='Holiday' totalSaved={531.00} targetOf={1440} />
      </section>
    </>
  )
}
 
export default page