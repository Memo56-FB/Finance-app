import { expect, it } from 'vitest'
import { projectBudgets, projectSummary, transactionRows } from './optimistic'
import type { Budget, Transaction } from './types'

const before: Budget = {
  id: '1', categoryId: '2', categoryName: 'Food', color: '#ffffff', month: '2027-03',
  spendingLimit: '100.00', spent: '25.00', available: '75.00', limitReached: false, exceededAmount: '0.00',
}

it('projects a new budget without assuming previous spending or duplicating a concurrent read', () => {
  const intent = { resource: 'budgets', action: 'save', value: { ...before, spendingLimit: '500.00' } } as const
  const operation = { key: 'local:1', intent }
  expect(projectBudgets([], [operation])).toMatchObject([{ id: 'local:1', spent: null, spendingLimit: '500.00' }])
  expect(projectBudgets([before], [operation])).toMatchObject([{ id: 'local:1', spent: '25.00', available: '475.00' }])
  expect(projectBudgets([before], [{ ...operation, confirmed: before }])).toMatchObject([
    { id: '1', localKey: 'local:1', available: '75.00' },
  ])
  expect(projectBudgets([before], [])).toEqual([before])
})

it('recomputes exact period amounts and moves a transaction between filters', () => {
  const movement: Transaction = {
    id: '4', name: 'Expense', categoryName: 'Food', categoryId: '2',
    amount: '-9007199254740993.01', transactionDate: '2027-03-10', sourceType: 'MANUAL',
    potId: null, potName: null, recurringPaymentId: null, occurrenceId: null,
    openingBalance: false, budgetWarnings: [],
  }
  const after = { ...movement, categoryId: '3', transactionDate: '2027-04-01' }
  const changes = [{ before: movement, after }]
  expect(transactionRows([movement], changes, { month: '2027-03' }, true)).toEqual([])
  expect(transactionRows([], changes, { month: '2027-04', categoryId: '3' }, true)).toEqual([after])
  expect(projectSummary({
    periodStart: '2027-03-01', periodEnd: '2027-03-31', income: '20.00',
    expenses: '9007199254740993.01', currentBalance: '-9007199254740973.01',
  }, changes)).toMatchObject({ expenses: '0.00', currentBalance: '20.00' })
})
