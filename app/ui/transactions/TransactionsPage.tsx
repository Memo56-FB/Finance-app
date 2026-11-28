'use client'

import { Text, useI18n } from '@/lib/i18n/client'
import { TransactionsTableMobile } from '@/app/ui/transactions/TransactionsTableMobile'
import { TransactionTableDesktop } from '@/app/ui/transactions/TransactionTableDesktop'
import { transactions } from '@/app/ui/transactions/data'
import { filterTransactions, getPageAfterFilterChange, getPageCount, paginateTransactions, sortTransactions } from '@/app/ui/transactions/utils'
import type { TransactionFilters, TransactionSort } from '@/app/ui/transactions/types'
import { InputSearch } from '@/components/ui/InputSearch'
import { ResponsiveSelect } from '@/components/ui/ResponsiveSelect'
import { Funnel, SortAscending } from '@phosphor-icons/react/dist/ssr'
import { PaginationControls } from '@/components/ui/pagination'
import { LoadingRegion, RowsSkeleton } from '@/app/ui/finance/Loading'
import React, { Suspense, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

const sortOptions: TransactionSort[] = ['Latest', 'Oldest', 'A to Z', 'Z to A', 'Highest', 'Lowest']
const categoryOptions = ['All Transactions', 'Entertainment', 'Bills', 'Groceries', 'Dining Out', 'Transportation', 'Personal Care']
const pageSize = 4

const TransactionsPage = () => {
  const { t, messages } = useI18n()

  const searchParams = useSearchParams()
  const urlQuery = searchParams.get('query') ?? ''
  // Keep typing synchronous while URL updates render in a transition.
  const [search, setSearch] = useState({ urlQuery, value: urlQuery })
  if (search.urlQuery !== urlQuery) {
    setSearch({ urlQuery, value: urlQuery })
  }
  const filters: TransactionFilters = {
    query: search.value,
    category: categoryOptions.find((option) => option === searchParams.get('category')) ?? 'All Transactions',
    sortBy: sortOptions.find((option) => option === searchParams.get('sortBy')) ?? 'Latest',
  }
  const { query, category, sortBy } = filters

  const filteredAndSortedTransactions = useMemo(() => (
    sortTransactions(filterTransactions(transactions, query, category), sortBy)
  ), [category, query, sortBy])
  const pageCount = getPageCount(filteredAndSortedTransactions, pageSize)
  const requestedPage = Number(searchParams.get('page') ?? 1)
  const page = Number.isSafeInteger(requestedPage) ? Math.min(Math.max(requestedPage, 1), pageCount) : 1
  const visibleTransactions = paginateTransactions(filteredAndSortedTransactions, page, pageSize)

  const updateFilters = (nextFilters: TransactionFilters) => {
    const params = new URLSearchParams({
      ...nextFilters,
      page: String(getPageAfterFilterChange(filters, nextFilters, page)),
    })
    window.history.replaceState(null, '', `?${params}`)
  }

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch({ urlQuery, value: event.currentTarget.value })
    updateFilters({ ...filters, query: event.currentTarget.value })
  }

  const handleCategoryChange = (nextCategory: string) => {
    updateFilters({ ...filters, category: nextCategory })
  }

  const handleSortChange = (nextSort: string) => {
    updateFilters({ ...filters, sortBy: nextSort as TransactionSort })
  }

  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(Math.min(Math.max(nextPage, 1), pageCount)))
    return `/finance/transactions?${params}`
  }

  return (
    <>
      <h1 tabIndex={-1} className='text-preset-1 text-ink'><Text id="Transactions" /></h1>
      <section className='bg-card mt-400 px-250 py-300 px-inset grid gap-300'>
        <div className='flex gap-300 items-center justify-between mb-300'>
          <InputSearch aria-label={t("Search transactions")} type='text' placeholder={t("Search transaction")} value={query} onChange={handleQueryChange} />
          <div className='flex gap-300'>
            <ResponsiveSelect label={t("Sort By")} options={sortOptions.map(value => ({ value, label: messages[value as keyof typeof messages] ?? value }))} value={sortBy} onValueChange={handleSortChange}>
              <SortAscending weight='fill' size={20} className='text-ink' />
            </ResponsiveSelect>
            <ResponsiveSelect label={t("Category")} options={categoryOptions.map(value => ({ value, label: messages[value as keyof typeof messages] ?? value }))} value={category} onValueChange={handleCategoryChange}>
              <Funnel weight='fill' size={20} className='text-ink' />
            </ResponsiveSelect>
          </div>
        </div>
        <TransactionTableDesktop transactions={visibleTransactions} />
        <TransactionsTableMobile transactions={visibleTransactions} />
        <PaginationControls className='pt-300' page={page} total={pageCount} link={number => ({ href: pageHref(number) })}/>
      </section>
    </>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<><h1 tabIndex={-1} className="text-preset-1 text-ink"><Text id="Transactions" /></h1><LoadingRegion><RowsSkeleton/></LoadingRegion></>}>
      <TransactionsPage />
    </Suspense>
  )
}
