import type { Transaction, TransactionFilters, TransactionSort } from './types'

export const filterTransactions = (
  source: readonly Transaction[],
  query: string,
  category: string,
) => {
  const normalizedQuery = query.trim().toLowerCase()

  return source.filter((transaction) => {
    const matchesQuery = normalizedQuery.length === 0
      || transaction.recipient.toLowerCase().includes(normalizedQuery)
    const matchesCategory = category === 'All Transactions'
      || transaction.category === category

    return matchesQuery && matchesCategory
  })
}

const compareById = (first: Transaction, second: Transaction) => first.id.localeCompare(second.id)

export const sortTransactions = (source: readonly Transaction[], sortBy: TransactionSort | string) => {
  return [...source].sort((first, second) => {
    if (sortBy === 'A to Z') {
      return first.recipient.localeCompare(second.recipient) || compareById(first, second)
    }

    if (sortBy === 'Z to A') {
      return second.recipient.localeCompare(first.recipient) || compareById(first, second)
    }

    if (sortBy === 'Highest') {
      return second.amount - first.amount || compareById(first, second)
    }

    if (sortBy === 'Lowest') {
      return first.amount - second.amount || compareById(first, second)
    }

    if (sortBy === 'Oldest') {
      return first.date.getTime() - second.date.getTime() || compareById(first, second)
    }

    return second.date.getTime() - first.date.getTime() || compareById(first, second)
  })
}

export const getPageCount = (source: readonly Transaction[], pageSize: number) => (
  Math.max(1, Math.ceil(source.length / pageSize))
)

export const paginateTransactions = (
  source: readonly Transaction[],
  page: number,
  pageSize: number,
) => {
  const pageCount = getPageCount(source, pageSize)
  const safePage = Math.min(Math.max(page, 1), pageCount)

  return source.slice((safePage - 1) * pageSize, safePage * pageSize)
}

export const getPageAfterFilterChange = (
  currentFilters: TransactionFilters,
  nextFilters: TransactionFilters,
  currentPage: number,
) => {
  const filtersChanged = currentFilters.query !== nextFilters.query
    || currentFilters.category !== nextFilters.category
    || currentFilters.sortBy !== nextFilters.sortBy

  return filtersChanged ? 1 : currentPage
}

export const formatTransactionAmount = (amount: number) => {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Math.abs(amount))

  return `${amount < 0 ? '-' : amount > 0 ? '+' : ''}${formattedAmount}`
}

export const formatTransactionDate = (date: Date) => date.toLocaleDateString('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})
