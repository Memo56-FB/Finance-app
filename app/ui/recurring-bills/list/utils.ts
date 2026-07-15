import type { RecurringBill } from './types'

export const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export type RecurringBillsSummary = {
  total: { amount: number; count: number }
  paid: { amount: number; count: number }
  upcoming: { amount: number; count: number }
  dueSoon: { amount: number; count: number }
}

export const calculateRecurringBillsSummary = (bills: RecurringBill[]): RecurringBillsSummary => {
  const summary = bills.reduce<RecurringBillsSummary>(
    (totals, bill) => {
      totals.total.amount += bill.amount
      totals.total.count += 1

      if (bill.status === 'paid') {
        totals.paid.amount += bill.amount
        totals.paid.count += 1
      } else {
        totals.upcoming.amount += bill.amount
        totals.upcoming.count += 1
        // The model has no date or due-soon threshold, so due soon means due.
        totals.dueSoon.amount += bill.amount
        totals.dueSoon.count += 1
      }

      return totals
    },
    {
      total: { amount: 0, count: 0 },
      paid: { amount: 0, count: 0 },
      upcoming: { amount: 0, count: 0 },
      dueSoon: { amount: 0, count: 0 },
    },
  )

  return summary
}

export const sortBills = (bills: RecurringBill[], sortBy: string) => {
  return [...bills].sort((firstBill, secondBill) => {
    if (sortBy === 'A to Z') {
      return firstBill.title.localeCompare(secondBill.title)
    }

    if (sortBy === 'Z to A') {
      return secondBill.title.localeCompare(firstBill.title)
    }

    if (sortBy === 'Highest') {
      return secondBill.amount - firstBill.amount
    }

    if (sortBy === 'Lowest') {
      return firstBill.amount - secondBill.amount
    }

    if (sortBy === 'Oldest') {
      return secondBill.dueDay - firstBill.dueDay
    }

    return firstBill.dueDay - secondBill.dueDay
  })
}

export const filterBillsByTitle = (bills: RecurringBill[], searchQuery: string) => {
  const normalizedQuery = searchQuery.trim().toLowerCase()

  if (normalizedQuery.length === 0) {
    return bills
  }

  return bills.filter((bill) => bill.title.toLowerCase().includes(normalizedQuery))
}
