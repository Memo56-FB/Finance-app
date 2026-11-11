import { Text } from '@/lib/i18n/client'

import { RecurringBillsLayout } from '@/app/ui/recurring-bills/RecurringBillsLayout'
import React from 'react'

const page = () => {
  return (
    <>
      <h1 className='text-preset-1 text-grey-900'><Text id="Recurring Bills" /></h1>
      <RecurringBillsLayout />
    </>
  )
}

export default page
