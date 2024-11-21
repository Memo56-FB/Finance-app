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
      <PotCard />
    </>
  )
}
 
export default page