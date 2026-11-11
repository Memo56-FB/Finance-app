import { transactions } from '../transactions/data'
import { filterTransactions, sortTransactions } from '../transactions/utils'

export const budgets = [
  { title: 'Entertainment', color: 'green', fill: '#277C78', ofValue: 50 },
  { title: 'Bills', color: 'cyan', fill: '#82C9D7', ofValue: 750 },
  { title: 'Dining Out', color: 'yellow', fill: '#F2CDAC', ofValue: 75 },
  { title: 'Personal Care', color: 'navy', fill: '#626070', ofValue: 100 },
].map((budget) => {
  const spending = sortTransactions(
    filterTransactions(transactions, '', budget.title).filter(({ amount }) => amount < 0),
    'Latest',
  )

  return {
    ...budget,
    spent: spending.reduce((total, { amount }) => total - amount, 0),
    latest: spending.slice(0, 3),
  }
})

export type Budget = (typeof budgets)[number]

export const totalBudget = budgets.reduce((total, budget) => total + budget.ofValue, 0)
export const totalSpent = budgets.reduce((total, budget) => total + budget.spent, 0)
