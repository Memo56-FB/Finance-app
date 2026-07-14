import type { RecurringBill } from './types'

export const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export const sortBills = (bills: RecurringBill[], sortBy: string) => {
  return [...bills].sort((firstBill, secondBill) => {
    if (sortBy === 'A to Z') {
      return firstBill.title.localeCompare(secondBill.title)
    }

    if (sortBy === 'Amount: High') {
      return secondBill.amount - firstBill.amount
    }

    if (sortBy === 'Amount: Low') {
      return firstBill.amount - secondBill.amount
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
