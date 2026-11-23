import { FinanceHydration } from '@/lib/finance/server'
import { Pots as LivePots } from '@/app/ui/finance/Pots'
import { requireAccess } from '@/lib/auth/server'
import type { PageProps } from '@/lib/auth/types'
import { Text } from '@/lib/i18n/client'

import { CreatePot } from '@/app/ui/pots/CreatePot'
import { PotCard } from '@/app/ui/pots/PotCard'
import React from 'react'

const page = async ({ searchParams }: PageProps) => {
  const params=await searchParams
  const access=await requireAccess('/finance/pots', params)
  if(access.kind === 'account') return <FinanceHydration account={access.username} section="pots" params={params}><LivePots/></FinanceHydration>
  return (
    <>
      <header className='flex flex-wrap items-center justify-between gap-200'>
        <h1 className='text-preset-1 text-grey-900'><Text id="Pots" /></h1>
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
