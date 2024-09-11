import { Summary } from '@/app/ui/overview/Summary'
import React from 'react'

const page = () => {
  return (
    <>
      <h1 className='text-preset-1 text-grey-900'>Overview</h1>
      <Summary />
      <section>
        pots/transaction...
      </section>
    </>
  )
}

export default page