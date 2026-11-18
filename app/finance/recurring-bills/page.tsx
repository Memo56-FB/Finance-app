import { FinanceHydration } from '@/lib/finance/server'
import { Recurring as LiveRecurring } from '@/app/ui/finance/Recurring'
import { requireAccess } from '@/lib/auth/server'
import type { PageProps } from '@/lib/auth/types'
import { Text } from '@/lib/i18n/client'

import { RecurringBillsLayout } from '@/app/ui/recurring-bills/RecurringBillsLayout'
import React from 'react'

const page = async ({ searchParams }: PageProps) => {
  const params=await searchParams
  const access=await requireAccess('/finance/recurring-bills', params)
  if(access.kind === 'account') return <FinanceHydration account={access.email} section="recurring" params={params}><LiveRecurring/></FinanceHydration>
  return (
    <>
      <h1 className='text-preset-1 text-grey-900'><Text id="Recurring Bills" /></h1>
      <RecurringBillsLayout />
    </>
  )
}

export default page
