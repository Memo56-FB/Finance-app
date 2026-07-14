'use client'

import { useMemo, useState } from 'react'
import { recurringBills, sortOptions } from './list/data'
import { RecurringBillsTable } from './list/RecurringBillsTable'
import { RecurringBillsToolbar } from './list/RecurringBillsToolbar'
import { filterBillsByTitle, sortBills } from './list/utils'

export const RecurringBillsList = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState(sortOptions[0])

  const visibleBills = useMemo(() => {
    const matchingBills = filterBillsByTitle(recurringBills, searchQuery)
    return sortBills(matchingBills, sortBy)
  }, [searchQuery, sortBy])

  return (
    <section className='bg-white rounded-xl px-250 py-300 grid gap-300 md:px-400'>
      <RecurringBillsToolbar
        searchQuery={searchQuery}
        sortBy={sortBy}
        onSearchQueryChange={setSearchQuery}
        onSortChange={setSortBy}
      />
      <RecurringBillsTable bills={visibleBills} />
    </section>
  )
}
