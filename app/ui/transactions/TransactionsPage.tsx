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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
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
      <h1 tabIndex={-1} className='text-preset-1 text-grey-900'><Text id="Transactions" /></h1>
      <section className='bg-white mt-400 px-250 py-300 rounded-xl grid gap-300'>
        <div className='flex gap-300 items-center justify-between mb-300'>
          <InputSearch aria-label={t("Search transactions")} type='text' placeholder={t("Search transaction")} value={query} onChange={handleQueryChange} />
          <div className='flex gap-300'>
            <ResponsiveSelect label={t("Sort By")} options={sortOptions.map(value => ({ value, label: messages[value as keyof typeof messages] ?? value }))} value={sortBy} onValueChange={handleSortChange}>
              <SortAscending weight='fill' size={20} className='text-grey-900' />
            </ResponsiveSelect>
            <ResponsiveSelect label={t("Category")} options={categoryOptions.map(value => ({ value, label: messages[value as keyof typeof messages] ?? value }))} value={category} onValueChange={handleCategoryChange}>
              <Funnel weight='fill' size={20} className='text-grey-900' />
            </ResponsiveSelect>
          </div>
        </div>
        <TransactionTableDesktop transactions={visibleTransactions} />
        <TransactionsTableMobile transactions={visibleTransactions} />
        <Pagination className='pt-300'>
          <PaginationContent className='w-full justify-center'>
            <PaginationItem className='justify-self-start mr-auto'>
              <PaginationPrevious
                href={pageHref(page - 1)}
                disabled={page <= 1}
              />
            </PaginationItem>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  href={pageHref(pageNumber)}
                  isActive={pageNumber === page}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem className='ml-auto'>
              <PaginationNext
                href={pageHref(page + 1)}
                disabled={page >= pageCount}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </section>
    </>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<h1 tabIndex={-1} className='text-preset-1 text-grey-900'><Text id="Transactions" /></h1>}>
      <TransactionsPage />
    </Suspense>
  )
}
