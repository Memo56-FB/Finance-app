export type Category = { id: string; name: string }
export type BudgetWarning = { budgetId: string; categoryId: string; month: string; limitReached: boolean; exceededAmount: string }
export type Transaction = Category & {
  categoryId: string | null; categoryName: string | null; transactionDate: string; amount: string
  sourceType: 'MANUAL' | 'POT' | 'RECURRING_PAYMENT'; potId: string | null; potName: string | null
  recurringPaymentId: string | null; occurrenceId: string | null; openingBalance: boolean; budgetWarnings: BudgetWarning[]
}
export type Budget = {
  id: string; categoryId: string; categoryName: string; spendingLimit: string; color: string; month: string
  spent: string; available: string; limitReached: boolean; exceededAmount: string
}
export type Pot = Category & { targetAmount: string; balance: string; color: string }
export type PotDeletion = { id: string; deletedAt: string; restoreUntil: string; serverTime?:string }
export type Summary = { periodStart: string; periodEnd: string; currentBalance: string; income: string; expenses: string }
export type CutSettings = { frequency: 'MONTHLY' | 'SEMIMONTHLY'; startDay: number }
export type RecurringPayment = Category & {
  categoryId: string; categoryName: string; type: 'SUBSCRIPTION' | 'INSTALLMENT'; amount: string; firstDueDate: string
  billingDay: number; totalInstallments: number | null; intervalMonths: number; paidInstallments: string; month: string; dueDate: string | null
  status: 'PENDING' | 'PAID' | 'VOID' | 'NOT_SCHEDULED'; occurrenceId: string | null; paidAmount: string | null; paidAt: string | null
}
export type PaymentGroup = { count: string; totalAmount: string }
export type PaymentSummary = { month: string; paid: PaymentGroup; pending: PaymentGroup; dueSoon: PaymentGroup; total: PaymentGroup }
export type PaymentRecorded = { occurrenceId: string; recurringPaymentId: string; month: string; status: 'PAID'; paidAt: string; transaction: Transaction; budgetWarnings: BudgetWarning[] }
export type List<T> = { items: T[] }
export type Page<T> = List<T> & { page: number; size: number; totalElements: string; totalPages: string }
export type PotList = List<Pot> & { totalBalance: string }
export type ListFilters = { search?: string; categoryId?: string; month?: string; sort?: string; page?: number; size?: number }
export type Section = 'overview' | 'categories' | 'transactions' | 'budgets' | 'pots' | 'recurring'
