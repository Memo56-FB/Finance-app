import { FinanceHydration } from '@/lib/finance/server'
import { Overview as LiveOverview } from '@/app/ui/finance/Overview'
import { requireAccess } from '@/lib/auth/server'
import type { PageProps } from '@/lib/auth/types'
import { Text } from '@/lib/i18n/client'

import { Budgets } from '@/app/ui/overview/Budgets'
import { Pots } from '@/app/ui/overview/Pots'
import { RecurringBills } from '@/app/ui/overview/RecurringBills'
import { Summary } from '@/app/ui/overview/Summary'
import { Transactions } from '@/app/ui/overview/Transactions'
import React from 'react'

const page = async ({ searchParams }: PageProps) => {
  const params=await searchParams
  const access=await requireAccess('/finance', params)
  if(access.kind === 'account') return <FinanceHydration account={access.username} section="overview" params={params}><LiveOverview/></FinanceHydration>
  return (
    <>
      <h1 className='text-preset-1 text-grey-900'><Text id="Overview" /></h1>
      <Summary />
      <section className='grid grid-cols-1 gap-200 xl:gap-0 xl:grid-cols-[auto_auto] xl:gap-x-300'>
        <div className='flex flex-col gap-200 xl:gap-200'>
          <Pots />
          <Transactions />
        </div>
        <div className='flex flex-col gap-200 xl:gap-200'>
          <Budgets />
          <RecurringBills />
        </div>
      </section>
    </>
  )
}

export default page