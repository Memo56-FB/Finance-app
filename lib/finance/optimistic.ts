import { cents, decimal } from './money'
import type { Budget, Category, CutSettings, ListFilters, Pot, RecurringPayment, Summary, Transaction } from './types'

type Upsert<T> = { action: 'save'; before?: T; value: T }
type Remove = { action: 'delete'; id: string }
export type BudgetFields = Pick<Budget, 'categoryId' | 'categoryName' | 'spendingLimit' | 'color'>

export type SaveIntent =
  | ({ resource: 'budgets' } & (Remove | { action: 'save'; before?: Budget; value: BudgetFields }))
  | ({ resource: 'categories' } & (Remove | Upsert<Category>))
  | ({ resource: 'transactions' } & (Upsert<Transaction> | (Remove & { before?: Transaction })))
  | ({ resource: 'savings-pots' } & (Remove | Upsert<Pot> | { action: 'restore'; value: Pot } | { action: 'move'; before: Pot; delta: bigint }))
  | ({ resource: 'recurring-payments' } & ((Remove & { before?: RecurringPayment }) | Upsert<RecurringPayment> | { action: 'pay'; before: RecurringPayment }))
  | { resource: 'settings'; action: 'save'; value: CutSettings }

export type BudgetView = Omit<Budget, 'spent' | 'available'> & {
  spent: string | null
  available: string | null
  localKey?: string
}

export type BudgetOperation = {
  key: string
  id?: string
  intent: Extract<SaveIntent, { resource: 'budgets' }>
  confirmed?: Budget
}

export function projectBudgets(items: Budget[], operations: BudgetOperation[], month?: string): BudgetView[] {
  let rows: BudgetView[] = items
  for (const { key, id, intent, confirmed } of operations) {
    if (intent.action === 'delete') {
      rows = rows.filter(row => row.id !== intent.id)
      continue
    }
    const fields = confirmed ?? intent.value
    const matchesMonth = confirmed && (!month || confirmed.month === month)
    const previous = rows.find(row => row.id === (id ?? confirmed?.id))
    const categoryRow = rows.find(row => row.categoryId === fields.categoryId)
    const spent = matchesMonth ? confirmed.spent
      : previous?.categoryId === fields.categoryId ? previous.spent
      : categoryRow?.spent ?? null
    const limit = cents(fields.spendingLimit)
    const available = spent === null ? null : decimal(limit - cents(spent))
    const row: BudgetView = {
      ...fields, id: confirmed?.id ?? id ?? key, localKey: key,
      month: month ?? confirmed?.month ?? previous?.month ?? rows[0]?.month ?? '',
      spent, available,
      limitReached: available !== null && cents(available) <= 0n,
      exceededAmount: available !== null && cents(available) < 0n ? decimal(-cents(available)) : '0.00',
    }
    rows = rows.flatMap(item => {
      if (item === previous) return [row]
      return item.id === confirmed?.id || item.categoryId === fields.categoryId ? [] : [item]
    })
    if (!previous) rows = [...rows, row]
  }
  return rows
}

export function applyRecord<T extends { id: string }>(items: T[], id: string, value?: T) {
  if (!value) return items.filter(item => item.id !== id)
  const found = items.some(item => item.id === id)
  return found ? items.map(item => item.id === id ? value : item) : [...items, value]
}

export type TransactionChange = { before?: Transaction; after?: Transaction }

export function transactionMatches(row: Transaction, filters: ListFilters) {
  return (!filters.categoryId || row.categoryId === filters.categoryId) &&
    (!filters.month || row.transactionDate.startsWith(filters.month)) &&
    (!filters.search || row.name.toLowerCase().includes(filters.search.toLowerCase()))
}

export function transactionRows(
  rows: Transaction[],
  changes: TransactionChange[],
  filters: ListFilters,
  complete: boolean,
) {
  let next = rows
  for (const { before, after } of changes) {
    const id = before?.id ?? after?.id
    if (id) next = applyRecord(next, id, after && transactionMatches(after, filters) ? after : undefined)
  }
  if (next === rows) return rows
  const ordered = sortFinancialRows(next, filters.sort, row => row.transactionDate)
  return complete ? ordered.slice(0, filters.size ?? 20) : ordered
}

export function sortFinancialRows<T extends { id: string; name: string; amount: string }>(
  rows: T[], sort = 'newest', date: (row: T) => string,
) {
  const cmp = <V extends string | bigint>(a: V, b: V) => a < b ? -1 : a > b ? 1 : 0
  const direction = ['newest', 'name_desc', 'amount_desc'].includes(sort) ? -1 : 1
  return rows.toSorted((a, b) => {
    const order = sort.startsWith('name_') ? a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      : sort.startsWith('amount_') ? cmp(cents(a.amount), cents(b.amount))
      : cmp(date(a), date(b))
    const idOrder = /^\d+$/.test(a.id) && /^\d+$/.test(b.id) ? cmp(BigInt(a.id), BigInt(b.id)) : cmp(a.id, b.id)
    return direction * (order || idOrder)
  })
}

export function projectSummary(base: Summary, changes: TransactionChange[]) {
  let income = cents(base.income), expenses = cents(base.expenses), balance = cents(base.currentBalance)
  function include(row: Transaction | undefined, direction: bigint) {
    if (!row || row.transactionDate < base.periodStart || row.transactionDate > base.periodEnd) return
    const amount = cents(row.amount)
    if (amount > 0n) income += amount * direction
    else expenses -= amount * direction
    balance += amount * direction
  }
  for (const { before, after } of changes) {
    include(before, -1n)
    include(after, 1n)
  }
  return { ...base, income: decimal(income), expenses: decimal(expenses), currentBalance: decimal(balance) }
}

export function recurringForMonth(row: RecurringPayment, month: string): RecurringPayment {
  if (row.month === month && row.occurrenceId) return row
  const monthIndex = (value: string) => Number(value.slice(0, 4)) * 12 + Number(value.slice(5, 7))
  const offset = monthIndex(month) - monthIndex(row.firstDueDate)
  const scheduled = offset >= 0 && offset % row.intervalMonths === 0 &&
    (row.totalInstallments === null || offset / row.intervalMonths < row.totalInstallments)
  const monthEnd = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate()
  const dueDate = scheduled ? month + '-' + String(Math.min(row.billingDay, monthEnd)).padStart(2, '0') : null
  return { ...row, month, dueDate, status: scheduled ? 'PENDING' : 'NOT_SCHEDULED',
    occurrenceId: null, paidAmount: null, paidAt: null }
}
