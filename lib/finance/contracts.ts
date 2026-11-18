import { validId } from '@/lib/api/finance-json'
import { validMonth } from '@/lib/api/finance-path'
import type { Budget, BudgetWarning, Category, CutSettings, Page, PaymentRecorded, PaymentSummary, Pot, PotDeletion, PotList, RecurringPayment, Summary, Transaction } from './types'

function check(condition: unknown): asserts condition { if (!condition) throw new Error('Invalid financial response') }
function record(value: unknown): Record<string, unknown> { check(value && typeof value === 'object' && !Array.isArray(value)); return value as Record<string, unknown> }
function text(value: unknown): value is string { return typeof value === 'string' }
function id(value: unknown) { return text(value) && validId(value) }
function money(value: unknown) { return text(value) && /^-?\d+(?:\.\d{1,2})?$/.test(value) }
function date(value: unknown) {
  if (!text(value) || !/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(value + 'T00:00:00Z')
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0,10) === value
}
function instant(value: unknown) { return text(value) && /Z$/.test(value) && Number.isFinite(Date.parse(value)) }
function color(value: unknown) { return text(value) && /^#[\da-f]{6}$/i.test(value) }
function category(value: unknown): Category {
  const row=record(value);check(id(row.id) && text(row.name));return row as Category
}
function warning(value: unknown): BudgetWarning {
  const row=record(value);check(id(row.budgetId) && id(row.categoryId) && text(row.month) && validMonth(row.month) && typeof row.limitReached === 'boolean' && money(row.exceededAmount));return row as BudgetWarning
}
function warnings(value: unknown): BudgetWarning[] { check(Array.isArray(value));return value.map(warning) }
function transaction(value: unknown): Transaction {
  const row=record(value);category(row)
  check((row.categoryId === null || id(row.categoryId)) && (row.categoryName === null || text(row.categoryName)) && date(row.transactionDate) && money(row.amount))
  check(['MANUAL','POT','RECURRING_PAYMENT'].includes(String(row.sourceType)) && typeof row.openingBalance === 'boolean')
  for (const key of ['potId','recurringPaymentId','occurrenceId']) check(row[key] === null || id(row[key]))
  check(row.potName === null || text(row.potName));warnings(row.budgetWarnings)
  return row as Transaction
}
function budget(value: unknown): Budget {
  const row=record(value);check(id(row.id) && id(row.categoryId) && text(row.categoryName) && color(row.color) && text(row.month) && validMonth(row.month) && typeof row.limitReached === 'boolean')
  for(const key of ['spendingLimit','spent','available','exceededAmount']) check(money(row[key]))
  return row as Budget
}
function pot(value: unknown): Pot { const row=record(value);category(row);check(color(row.color) && money(row.balance) && money(row.targetAmount));return row as Pot }
function recurring(value: unknown): RecurringPayment {
  const row=record(value);category(row)
  check(id(row.categoryId) && text(row.categoryName) && ['SUBSCRIPTION','INSTALLMENT'].includes(String(row.type)) && money(row.amount) && date(row.firstDueDate))
  check(Number.isInteger(row.billingDay) && Number(row.billingDay) >= 1 && Number(row.billingDay) <= 31)
  check(row.totalInstallments === null || Number.isInteger(row.totalInstallments) && Number(row.totalInstallments) > 0)
  check(text(row.paidInstallments) && /^\d+$/.test(row.paidInstallments) && text(row.month) && validMonth(row.month) && (row.dueDate === null || date(row.dueDate)))
  check(['PENDING','PAID','VOID','NOT_SCHEDULED'].includes(String(row.status)) && (row.occurrenceId === null || id(row.occurrenceId)) && (row.paidAmount === null || money(row.paidAmount)) && (row.paidAt === null || instant(row.paidAt)))
  return row as RecurringPayment
}
export const financialRow = { categories: category, transactions: transaction, budgets: budget, 'savings-pots': pot, 'recurring-payments': recurring }
export type Resource = keyof typeof financialRow
export function list<T>(value: unknown, decode: (value: unknown) => T): Record<string, unknown> & { items:T[] } { const row=record(value);check(Array.isArray(row.items));return { ...row, items: row.items.map(decode) } }
export function page<T>(value: unknown, decode: (value: unknown) => T): Page<T> {
  const row=list(value,decode)
  check(Number.isInteger(row.page) && Number(row.page) >= 0 && Number.isInteger(row.size) && Number(row.size) >= 1 && Number(row.size) <= 100)
  check(text(row.totalElements) && /^\d+$/.test(row.totalElements) && text(row.totalPages) && /^\d+$/.test(row.totalPages))
  return row as Page<T>
}
export function potList(value: unknown): PotList { const row=list(value,pot);check(money(row.totalBalance));return row as PotList }
export function summary(value: unknown): Summary { const row=record(value);check(date(row.periodStart) && date(row.periodEnd) && money(row.income) && money(row.expenses) && money(row.currentBalance));return row as Summary }
export function settings(value: unknown): CutSettings { const row=record(value);check(['MONTHLY','SEMIMONTHLY'].includes(String(row.frequency)) && Number.isInteger(row.startDay) && Number(row.startDay) >= 1 && Number(row.startDay) <= 31);return row as CutSettings }
export function paymentSummary(value: unknown): PaymentSummary {
  const row=record(value);check(text(row.month) && validMonth(row.month))
  for (const key of ['paid','pending','dueSoon','total']) { const group=record(row[key]);check(text(group.count) && /^\d+$/.test(group.count) && money(group.totalAmount)) }
  return row as PaymentSummary
}
export function deletion(value: unknown): PotDeletion { const row=record(value);check(id(row.id) && instant(row.deletedAt) && instant(row.restoreUntil));return row as PotDeletion }
export function recorded(value: unknown): PaymentRecorded { const row=record(value);check(id(row.occurrenceId) && id(row.recurringPaymentId) && text(row.month) && validMonth(row.month) && row.status === 'PAID' && instant(row.paidAt));transaction(row.transaction);warnings(row.budgetWarnings);return row as PaymentRecorded }
export function calendarDate(value: string) { return date(value) }
