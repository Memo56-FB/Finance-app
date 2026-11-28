import { Skeleton } from '@/components/ui/skeleton'
import { LoadingRegion } from '@/app/ui/finance/Loading'
import { Money, Text } from '@/lib/i18n/client'

import { Button } from '@/components/ui/button'
import { TipJar } from '@phosphor-icons/react/dist/ssr'
import React from 'react'
import Link from '@/app/ui/finance/FinanceLink'
import type { Pot } from '@/lib/finance/types'
import type { MoneyValue } from '@/lib/finance/money'
import { safeColor } from '@/lib/finance/colors'

const PotMiniCard = ({ color, title, value }: {
  color: string
  title: string
  value: React.ReactNode
}) => {
  return (
    <article className='relative flex gap-200'>
      <div aria-hidden className="h-full w-1 shrink-0 rounded-none" style={{backgroundColor:safeColor(color)}} />
      <div className='grid gap-50'>
        <h3 className='text-preset-5 text-ink-muted break-words'>{title}</h3>
        <p className='text-preset-4-bold text-ink break-all'>{value}</p>
      </div>
    </article>
  )
}

export const Pots = ({items,total=850}: {items?:Pot[];total?:MoneyValue | null}) => {
  return (
    <article className='py-300 px-250 md:p-400 grid gap-250 bg-card px-inset'>
      <div className='flex flex-wrap justify-between gap-100'>
        <h2 className='text-preset-2 text-ink'><Text id="Pots" /></h2>
        <Button variant={'tertiary'} asChild><Link href="/finance/pots"><Text id="See Details" /></Link></Button>
      </div>
      <div className='grid gap-250 grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))]'>
        <article className='p-200 flex flex-wrap gap-200 items-center bg-background px-inset'>
          <TipJar className='text-green' size={40} />
          <div className='gap-[11px] grid'>
            <h3 className='text-preset-4 text-ink-muted'><Text id="Total Saved" /></h3>
            {total === null
              ? <LoadingRegion><Skeleton className="h-8 w-28"/></LoadingRegion>
              : <p className='text-preset-1 text-ink break-all'><Money value={total} /></p>}
          </div>
        </article>
        <section className='grid grid-cols-2 xl:grid-rows-2 gap-200'>
          {items ? items.length ? items.slice(0,4).map(pot=><PotMiniCard key={pot.id} color={pot.color} title={pot.name} value={<Money value={pot.balance}/>}/>) : <p className="text-preset-4 text-ink-muted"><Text id="No pots yet."/></p> : <><PotMiniCard
            color='green'
            title='Savings'
            value={<Money value={159} />}
          />
          <PotMiniCard
            color='cyan'
            title='Gift'
            value={<Money value={40} />}
          />
          <PotMiniCard
            color='navy'
            title='Concert Ticket'
            value={<Money value={110} />}
          />
          <PotMiniCard
            color='yellow'
            title='New Laptop'
            value={<Money value={10} />}
          /></>}

        </section>
      </div>
    </article>
  )
}
