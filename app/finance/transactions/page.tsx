'use client'

import { TransactionsTableMobile } from '@/app/ui/transactions/TransactionsTableMobile'
import { TransactionTableDesktop } from '@/app/ui/transactions/TransactionTableDesktop'
import { transactions } from '@/app/ui/transactions/data'
import { filterTransactions, getPageCount, paginateTransactions, sortTransactions } from '@/app/ui/transactions/utils'
import type { TransactionSort } from '@/app/ui/transactions/types'
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
import React, { useMemo, useState } from 'react'

const sortOptions: TransactionSort[] = ['Latest', 'Oldest', 'A to Z', 'Z to A', 'Highest', 'Lowest']
const categoryOptions = ['All Transactions', 'Entertainment', 'Bills', 'Groceries', 'Dining Out', 'Transportation', 'Personal Care']
const pageSize = 4

const Page = () => {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All Transactions')
  const [sortBy, setSortBy] = useState<TransactionSort>('Latest')
  const [page, setPage] = useState(1)

  const filteredAndSortedTransactions = useMemo(() => (
    sortTransactions(filterTransactions(transactions, query, category), sortBy)
  ), [category, query, sortBy])
  const pageCount = getPageCount(filteredAndSortedTransactions, pageSize)
  const visibleTransactions = paginateTransactions(filteredAndSortedTransactions, page, pageSize)

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.currentTarget.value)
    setPage(1)
  }

  const handleCategoryChange = (nextCategory: string) => {
    setCategory(nextCategory)
    setPage(1)
  }

  const handleSortChange = (nextSort: string) => {
    setSortBy(nextSort as TransactionSort)
    setPage(1)
  }

  const goToPage = (nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 1), pageCount))
  }

  return (
    <>
      <h1 className='text-preset-1 text-grey-900'>Transactions</h1>
      <section className='bg-white mt-400 px-250 py-300 rounded-xl grid gap-300'>
        <div className='flex gap-300 items-center justify-between mb-300'>
          <InputSearch type='text' placeholder='Search transaction' value={query} onChange={handleQueryChange} />
          <div className='flex gap-300'>
            <ResponsiveSelect label='Sort By' options={sortOptions} value={sortBy} onValueChange={handleSortChange}>
              <SortAscending weight='fill' size={20} className='text-grey-900' />
            </ResponsiveSelect>
            <ResponsiveSelect label='Category' options={categoryOptions} value={category} onValueChange={handleCategoryChange}>
              <Funnel weight='fill' size={20} className='text-grey-900' />
            </ResponsiveSelect>
          </div>
        </div>
        <TransactionTableDesktop transactions={visibleTransactions} />
        <TransactionsTableMobile transactions={visibleTransactions} />
        <Pagination className='pt-300'>
          <PaginationContent className='w-full justify-center'>
            {page > 1 && (
              <PaginationItem className='justify-self-start mr-auto'>
                <PaginationPrevious
                  href={`/finance/transactions?page=${page - 1}`}
                  onClick={(event) => {
                    event.preventDefault()
                    goToPage(page - 1)
                  }}
                />
              </PaginationItem>
            )}
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  href={`/finance/transactions?page=${pageNumber}`}
                  isActive={pageNumber === page}
                  onClick={(event) => {
                    event.preventDefault()
                    goToPage(pageNumber)
                  }}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ))}
            {page < pageCount && (
              <PaginationItem className='ml-auto'>
                <PaginationNext
                  href={`/finance/transactions?page=${page + 1}`}
                  onClick={(event) => {
                    event.preventDefault()
                    goToPage(page + 1)
                  }}
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      </section>
    </>
  )
}

export default Page
