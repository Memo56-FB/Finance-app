'use client'
import { createContext, useContext, useEffect, useId, useRef, useState } from 'react'
import type { ComponentProps, ReactNode, RefCallback } from 'react'
import { hashKey, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DotsThreeOutline } from '@phosphor-icons/react/dist/ssr'
import { useI18n } from '@/lib/i18n/client'
import type { Messages } from '@/lib/i18n'
import { ApiError } from '@/lib/api/client'
import { SessionRetry, useFinance, useAccountSession } from '@/lib/finance/AccountScope'
import { financeKey, recentTransactionFilters } from '@/lib/finance/queries'
import type { Resource } from '@/lib/finance/contracts'
import type { Budget, BudgetWarning, Category, CutSettings, List, ListFilters, Page, PaymentRecorded, PaymentSummary, Pot, PotList, RecurringPayment, Summary, Transaction } from '@/lib/finance/types'
import { applyRecord, projectBudgets, projectSummary, recurringForMonth, sortFinancialRows, transactionMatches, transactionRows, type TransactionChange, type BudgetOperation, type SaveIntent } from '@/lib/finance/optimistic'
import { cents, decimal } from '@/lib/finance/money'
import { LoadingRegion, RowsSkeleton } from './Loading'
import { cn } from '@/lib/utils'

export type Label = keyof Messages
export const panel='grid gap-250 px-inset bg-card px-250 py-300 md:p-400 min-w-0'
export const financeDialog='w-[320px] px-250 py-300 md:w-full grid gap-250'
export function PageHeader({title,children}:{title:Label;children?:ReactNode}) { const {t}=useI18n();return <header className="flex flex-wrap items-center justify-between gap-200"><h1 tabIndex={-1} className="text-preset-1 text-ink">{t(title)}</h1>{children}</header> }
export function QueryMessage({query, fallback = <RowsSkeleton/>}:{query:{isPending:boolean;isError:boolean;isRefetching?:boolean;data?:unknown;refetch:() => unknown};fallback?:ReactNode}) {
  const {t}=useI18n()
  const session = useAccountSession()
  if (query.isPending && session?.phase !== 'unavailable') return fallback && <LoadingRegion>{fallback}</LoadingRegion>
  if(query.isError) return <div role="alert" className="grid gap-150 text-red"><p>{t('Could not load data. Please retry.')}</p><Button type="button" variant="secondary" disabled={session?.phase !== 'active'} onClick={()=>void query.refetch()}>{t('Reload data')}</Button></div>
  return null
}
export function Empty({label}:{label:Label}) { return <p className="text-preset-4 text-ink-muted">{useI18n().t(label)}</p> }
export function FormInput({label,error,money=false,...props}:ComponentProps<typeof Input> & {label:Label;error?:string;money?:boolean}) {
  const id=useId(),{t}=useI18n()
  const input=<Input {...props} id={id} className={cn(money && 'pl-[5rem]',props.className)} aria-invalid={!!error || undefined} aria-describedby={error ? id+'-error' : undefined}/>
  return <div className="grid gap-50"><label htmlFor={id} className="text-preset-5-bold text-ink-muted">{t(label)}</label>{money ? <div className="relative"><span aria-hidden="true" className="absolute left-250 top-[10px] text-preset-4 text-ink-muted">$</span>{input}</div> : input}{error && <p id={id+'-error'} className="text-red text-preset-5">{error}</p>}</div>
}
export function FormSelect({label,value,onChange,options,error}:{label:Label;value:string;onChange:(value:string)=>void;options:{value:string;label:string}[];error?:string}) {
  const id=useId(),{t}=useI18n()
  return <div className="grid gap-50 min-w-0"><label htmlFor={id} className="text-preset-5-bold text-ink-muted">{t(label)}</label><Select value={value} onValueChange={onChange}><SelectTrigger id={id} className="min-w-0 [&>span]:truncate" aria-invalid={!!error || undefined} aria-describedby={error ? id+'-error' : undefined}><SelectValue placeholder={t(label)}/></SelectTrigger><SelectContent className="max-w-[calc(100vw_-_32px)]">{options.map(option=><SelectItem key={option.value} value={option.value} className="whitespace-normal break-words [overflow-wrap:anywhere]">{option.label}</SelectItem>)}</SelectContent></Select>{error && <p id={id+'-error'} className="text-red text-preset-5">{error}</p>}</div>
}
export function errorLabel(error:unknown,category=false):Label {
  if(error instanceof ApiError) {
    if(error.status === 400) return 'Please review the marked fields.'
    if(error.status === 403) return 'Your security token expired. Please retry.'
    if(error.status === 404) return 'This record is no longer available. Reload the list.'
    if(error.status === 409) return category ? 'This category is used by a budget or recurring payment.' : 'This change conflicts with the saved data. Reload and review it.'
  }
  return 'The result is uncertain. Reload data before trying again.'
}
type DialogSave = {
  begin: () => boolean
  fail: () => void
  complete: () => void
}
const DialogSaveContext = createContext<DialogSave | null>(null)

type Draft = Record<string, string>
type SaveOptions<Result> = {
  resource: Resource | 'settings'
  id?: string
  label: Label
  name?: string
  draft?: Draft
  editor?: ReactNode
  intent?: SaveIntent
  linked?: 'POT' | 'RECURRING_PAYMENT' | 'MANUAL'
  onConfirmed?: (result: Result, receivedAt: number) => void
}
type Operation = Omit<SaveOptions<unknown>, 'onConfirmed'> & {
  sequence: number
  key: string
  confirmed?: unknown
  baselines: ReadonlyMap<string, unknown>
  state: 'pending' | 'rejected' | 'uncertain' | 'refreshing' | 'refresh'
  error?: unknown
}

const DraftContext = createContext<Operation | null>(null)
type Operations = {
  operations: Operation[]
  recordKeys: ReadonlyMap<string, string>
  submit: <Result>(options: SaveOptions<Result>, execute: (signal?: AbortSignal) => Promise<Result>, replace?: number) => boolean
}
const OperationsContext = createContext<Operations | null>(null)

export function useDraftField(field: string, initial: string | (() => string)) {
  const recovered = useContext(DraftContext)
  return useState(() => recovered?.draft?.[field] ?? (typeof initial === 'function' ? initial() : initial))
}

export function useSaveOperation() {
  const operations = useContext(OperationsContext)
  if (!operations) throw new Error('SaveOperations is required')
  return operations.submit
}

function useVisibleOperations() {
  return (useContext(OperationsContext)?.operations ?? []).filter(operation =>
    operation.intent && (operation.state === 'pending' || operation.state === 'refreshing' || operation.state === 'refresh'))
}

export function useCategoryView(data: List<Category> | undefined) {
  const operations = useVisibleOperations()
  const pendingCreate = operations.find(operation => operation.intent?.resource === 'categories' &&
    operation.intent.action === 'save' && !operation.id && !operation.confirmed)
  const base = pendingCreate?.baselines.get(hashKey(['categories'])) as List<Category> | undefined
  let rows = pendingCreate ? base?.items ?? [] : data?.items
  for (const operation of operations) {
    const intent = operation.intent
    if (intent?.resource !== 'categories') continue
    if (intent.action === 'delete') {
      if (rows) rows = applyRecord(rows, intent.id)
    } else {
      const value = operation.confirmed as Category | undefined
      const id = value?.id ?? operation.id ?? operation.key
      rows = applyRecord(rows ?? [], id, value ?? { ...intent.value, id })
    }
  }
  return rows
}

function useEditedCategoryNames() {
  const operations = useVisibleOperations()
  const names = new Map<string, string>()
  for (const operation of operations) {
    const intent = operation.intent
    if (intent?.resource === 'categories' && intent.action === 'save' && operation.id) {
      names.set(operation.id, (operation.confirmed as Category | undefined)?.name ?? intent.value.name)
    }
  }
  return names
}

export function usePotView(data: PotList | undefined, month?: string) {
  const operations = useVisibleOperations()
  const pendingCreate = operations.find(operation => operation.intent?.resource === 'savings-pots' &&
    operation.intent.action === 'save' && !operation.id && !operation.confirmed)
  const base = pendingCreate?.baselines.get(hashKey(['pots', month ?? 'current'])) as PotList | undefined
  let rows = pendingCreate ? base?.items ?? [] : data?.items
  for (const operation of operations) {
    const intent = operation.intent
    if (intent?.resource !== 'savings-pots') continue
    if (intent.action === 'delete') {
      if (rows) rows = applyRecord(rows, intent.id)
      continue
    }
    const confirmed = operation.confirmed as Pot | undefined
    const id = confirmed?.id ?? operation.id ?? operation.key
    const current = rows?.find(row => row.id === id)
    if (intent.action === 'move' && month) continue
    const value = intent.action === 'move'
      ? { ...intent.before, balance: decimal(cents(intent.before.balance) + intent.delta) }
      : { ...intent.value, id }
    const result = confirmed && !month ? confirmed : value
    rows = applyRecord(rows ?? [], id, month && current ? { ...result, balance: current.balance } : result)
  }
  const corrections = new Map<string, { balance: bigint; delta: bigint; sequence: number }>()
  for (const operation of operations) {
    const intent = operation.intent
    if (!rows || intent?.resource !== 'transactions' || !intent.before?.potId) continue
    const before = intent.before
    const potId = intent.before.potId
    const monthEnd = month ? month + '-31' : undefined
    const amount = (row?: Transaction) => row && (!monthEnd || row.transactionDate <= monthEnd) ? cents(row.amount) : 0n
    const after = intent.action === 'save' ? (operation.confirmed as Transaction | undefined) ?? intent.value : undefined
    const correction = corrections.get(potId)
    const base = operation.baselines.get(hashKey(['pots', month ?? 'current'])) as PotList | undefined
    const original = base?.items.find(row => row.id === potId)
    if (correction) correction.delta += amount(after) - amount(before)
    else if (original) corrections.set(potId, { balance: cents(original.balance), delta: amount(after) - amount(before), sequence: operation.sequence })
  }
  for (const [potId, correction] of corrections) {
    const current = rows?.find(row => row.id === potId)
    if (!rows || !current) continue
    const directMove = month ? undefined : operations.find(operation =>
      operation.intent?.resource === 'savings-pots' && operation.intent.action === 'move' && operation.id === potId)
    const move = directMove?.intent?.resource === 'savings-pots' && directMove.intent.action === 'move'
      ? directMove.intent : undefined
    const balance = move && directMove && directMove.sequence < correction.sequence ? cents(move.before.balance) : correction.balance
    rows = applyRecord(rows, potId, { ...current, balance: decimal(balance + correction.delta + (move?.delta ?? 0n)) })
  }
  if (rows === data?.items) return data
  return rows && {
    items: rows,
    totalBalance: pendingCreate && !base ? null : decimal(rows.reduce((sum, row) => sum + cents(row.balance), 0n)),
  }
}

export function useSettingsView(data: CutSettings | undefined) {
  const operation = useVisibleOperations().findLast(entry => entry.intent?.resource === 'settings')
  return operation?.intent?.resource === 'settings'
    ? (operation.confirmed as CutSettings | undefined) ?? operation.intent.value
    : data
}

export function useBudgetView(data: List<Budget> | undefined, month?: string) {
  const keys = useContext(OperationsContext)?.recordKeys
  const changes = useTransactionChanges()
  const names = useEditedCategoryNames()
  const operations = useVisibleOperations()
  const budgetOperations = operations.flatMap((operation): BudgetOperation[] => {
    if (operation.intent?.resource !== 'budgets' ||
      !['pending', 'refreshing', 'refresh'].includes(operation.state)) return []
    return [{ key: operation.key, id: operation.id, intent: operation.intent, confirmed: operation.confirmed as Budget | undefined }]
  })
  if (!data && !budgetOperations.length) return undefined
  const transaction = operations.find(operation => operation.intent?.resource === 'transactions')
  const base = transaction?.baselines.get(hashKey(['budgets', month ?? 'current'])) as List<Budget> | undefined
  const budgets = projectBudgets(base?.items ?? data?.items ?? [], budgetOperations, month)
  return budgets.map(record => {
    const categoryName = names.get(record.categoryId)
    const row = categoryName ? { ...record, categoryName } : record
    const localKey = keys?.get('budgets:' + row.id) ?? row.localKey
    if (!base || row.spent === null || !changes.length) return localKey ? { ...row, localKey } : row
    const expense = (transaction?: Transaction) => transaction?.categoryId === row.categoryId &&
      transaction.transactionDate.startsWith(row.month) && cents(transaction.amount) < 0n ? -cents(transaction.amount) : 0n
    const spent = changes.reduce((sum, change) => sum + expense(change.after) - expense(change.before), cents(row.spent))
    const available = cents(row.spendingLimit) - spent
    return { ...row, localKey, spent: decimal(spent), available: decimal(available),
      limitReached: row.limitReached, exceededAmount: row.exceededAmount }
  })
}

function useTransactionChanges() {
  return useVisibleOperations().flatMap((operation): TransactionChange[] => {
    const intent = operation.intent
    if (intent?.resource === 'recurring-payments' && intent.action === 'pay' && operation.confirmed) {
      return [{ after: (operation.confirmed as PaymentRecorded).transaction }]
    }
    if (intent?.resource !== 'transactions') return []
    if (intent.action === 'delete') return intent.before ? [{ before: intent.before }] : []
    const after = (operation.confirmed as Transaction | undefined) ?? {
      ...intent.value, id: operation.id ?? operation.key,
    }
    return [{ before: intent.before, after }]
  })
}

export function useTransactionView(data: Page<Transaction> | undefined, filters: ListFilters) {
  const changes = useTransactionChanges()
  const operations = useVisibleOperations()
  const names = useEditedCategoryNames()
  if (!data && !changes.some(change => change.after && transactionMatches(change.after, filters))) return undefined
  const hiddenPots = new Set(operations.flatMap(operation =>
    operation.intent?.resource === 'savings-pots' && operation.intent.action === 'delete' ? [operation.intent.id] : []))
  const pendingCreate = operations.find(operation => operation.intent?.resource === 'transactions' &&
    operation.intent.action === 'save' && !operation.id && !operation.confirmed &&
    transactionMatches(operation.intent.value, filters))
  const key = hashKey(['transactions', { ...filters, search: filters.search || undefined }])
  const base = pendingCreate ? pendingCreate.baselines.get(key) as Page<Transaction> | undefined : data
  const rows = transactionRows(base?.items ?? [], changes, filters, base?.totalPages === '1' || base?.totalPages === '0')
  return rows.filter(row => !row.potId || !hiddenPots.has(row.potId)).map(row => {
    const categoryName = row.categoryId && names.get(row.categoryId)
    return categoryName ? { ...row, categoryName } : row
  })
}

export function useRecentExpenseView(data: Transaction[] | undefined, categoryId: string, month: string) {
  const changes = useTransactionChanges().flatMap(({ before, after }) => {
    const oldExpense = before && cents(before.amount) < 0n ? before : undefined
    const newExpense = after && cents(after.amount) < 0n ? after : undefined
    return oldExpense || newExpense ? [{ before: oldExpense, after: newExpense }] : []
  })
  const operations = useVisibleOperations()
  const filters = { categoryId, month, size: 3 }
  const pendingCreate = operations.find(operation => operation.intent?.resource === 'transactions' &&
    operation.intent.action === 'save' && !operation.id && !operation.confirmed &&
    cents(operation.intent.value.amount) < 0n && transactionMatches(operation.intent.value, filters))
  const base = pendingCreate ? pendingCreate.baselines.get(hashKey(['budget-expenses', categoryId, month])) as Transaction[] | undefined : data
  return base || changes.some(change => change.after && transactionMatches(change.after, filters))
    ? transactionRows(base ?? [], changes, filters, true)
    : undefined
}

export function useSummaryView(data: Summary | undefined, month?: string) {
  const operations = useVisibleOperations()
  const changes = useTransactionChanges()
  const transaction = operations.find(operation => operation.intent?.resource === 'transactions' ||
    (operation.intent?.resource === 'recurring-payments' && operation.intent.action === 'pay'))
  const base = transaction?.baselines.get(hashKey(['summary', month ?? 'current'])) as Summary | undefined
  return base && changes.length ? projectSummary(base, changes) : data
}

export function useRecurringView(data: Page<RecurringPayment> | undefined, filters: ListFilters, currentMonth?: string) {
  const operations = useVisibleOperations()
  const names = useEditedCategoryNames()
  const month = filters.month ?? data?.items[0]?.month ?? currentMonth
  const pendingCreate = operations.find(operation => operation.intent?.resource === 'recurring-payments' &&
    operation.intent.action === 'save' && !operation.id && !operation.confirmed && month &&
    recurringForMonth(operation.intent.value, month).dueDate &&
    (!filters.search || operation.intent.value.name.toLowerCase().includes(filters.search.toLowerCase())))
  const key = hashKey(['recurring', { ...filters, search: filters.search || undefined }])
  const base = pendingCreate ? pendingCreate.baselines.get(key) as Page<RecurringPayment> | undefined : data
  let rows = base?.items
  for (const operation of operations) {
    const intent = operation.intent
    if (intent?.resource !== 'recurring-payments') continue
    if (intent.action === 'delete') {
      if (rows) rows = applyRecord(rows, intent.id)
    } else if (intent.action === 'pay') {
      if (intent.before.month !== month || !rows) continue
      const result = operation.confirmed as PaymentRecorded | undefined
      rows = rows.map(row => row.id === intent.before.id ? {
        ...row, status: 'PAID', paidAmount: result ? decimal(-cents(result.transaction.amount)) : intent.before.amount,
        occurrenceId: result?.occurrenceId ?? row.occurrenceId, paidAt: result?.paidAt ?? row.paidAt,
        paidInstallments: row.totalInstallments === null ? row.paidInstallments : String(BigInt(intent.before.paidInstallments) + 1n),
      } : row)
    } else if (month) {
      const confirmed = operation.confirmed as RecurringPayment | undefined
      const id = confirmed?.id ?? operation.id ?? operation.key
      const old = rows?.find(row => row.id === id)
      const value = recurringForMonth({ ...(confirmed ?? intent.value), id }, month)
      const matches = (!filters.search || value.name.toLowerCase().includes(filters.search.toLowerCase())) &&
        (value.status !== 'NOT_SCHEDULED' || Boolean(old?.occurrenceId))
      rows = applyRecord(rows ?? [], id, matches ? value : undefined)
    }
  }
  if (rows && rows !== base?.items) {
    rows = sortFinancialRows(rows, filters.sort, row => row.dueDate ?? '')
    if (base?.totalPages === '0' || base?.totalPages === '1') rows = rows.slice(0, filters.size ?? 20)
  }
  return rows?.map(row => {
    const categoryName = names.get(row.categoryId)
    return categoryName ? { ...row, categoryName } : row
  })
}

export function usePaymentSummaryView(data: PaymentSummary | undefined, month?: string) {
  const operations = useVisibleOperations().filter(operation => operation.intent?.resource === 'recurring-payments')
  const base = operations[0]?.baselines.get(hashKey(['payment-summary', month ?? 'current'])) as PaymentSummary | undefined
  if (!base) return data
  let paid = base.paid, pending = base.pending
  for (const operation of operations) {
    const { intent } = operation
    if (intent?.resource !== 'recurring-payments') continue
    if (intent.action === 'pay') {
      if (intent.before.month !== base.month || intent.before.status === 'PAID' || !intent.before.dueDate) continue
      const result = operation.confirmed as PaymentRecorded | undefined
      const amount = result ? -cents(result.transaction.amount) : cents(intent.before.amount)
      paid = { count: String(BigInt(paid.count) + 1n), totalAmount: decimal(cents(paid.totalAmount) + amount) }
      pending = { count: String(BigInt(pending.count) - 1n), totalAmount: decimal(cents(pending.totalAmount) - cents(intent.before.amount)) }
      continue
    }
    const before = intent.before
    if (before && (before.month !== base.month || before.status === 'PAID')) continue
    if (intent.action === 'delete' && !before) continue
    const after = intent.action === 'save'
      ? recurringForMonth((operation.confirmed as RecurringPayment | undefined) ?? intent.value, base.month)
      : undefined
    const wasScheduled = Boolean(before?.dueDate)
    const isScheduled = Boolean(after?.dueDate) && after?.status !== 'PAID'
    const count = BigInt(pending.count) + BigInt(Number(isScheduled) - Number(wasScheduled))
    const amount = cents(pending.totalAmount) + (isScheduled && after ? cents(after.amount) : 0n)
      - (wasScheduled && before ? cents(before.amount) : 0n)
    pending = { count: String(count), totalAmount: decimal(amount) }
  }
  const total = {
    count: String(BigInt(paid.count) + BigInt(pending.count)),
    totalAmount: decimal(cents(paid.totalAmount) + cents(pending.totalAmount)),
  }
  return { ...base, paid, pending, total }
}

function affectedQueries(operation: Pick<Operation, 'resource' | 'linked'>) {
  switch (operation.resource) {
    case 'settings': return ['summary']
    case 'categories': return ['categories', 'transactions', 'budgets', 'recurring', 'budget-expenses']
    case 'budgets': return ['budgets', 'budget-expenses']
    case 'savings-pots': return ['pots', 'transactions', 'summary', 'budgets', 'budget-expenses']
    case 'recurring-payments': return ['recurring', 'payment-summary', 'transactions', 'summary', 'budgets', 'budget-expenses']
    case 'transactions': return ['transactions', 'summary', 'budgets', 'budget-expenses',
      ...(operation.linked === 'POT' || !operation.linked ? ['pots'] : []),
      ...(operation.linked === 'RECURRING_PAYMENT' || !operation.linked ? ['recurring', 'payment-summary'] : [])]
  }
}

function showOperation(operation: Operation) {
  return operation.state !== 'refreshing' && !(operation.state === 'pending' && operation.intent)
}

export function SaveOperations({ children }: { children: ReactNode }) {
  const { account, canAct, whenVerified, operationSignal, notify, phase, queries, concealed } = useFinance()
  const client = useQueryClient()
  const { t } = useI18n()
  const records = useRef<Operation[]>([])
  const next = useRef(0)
  const [recordKeys, setRecordKeys] = useState<ReadonlyMap<string, string>>(() => new Map())
  const [operations, setOperations] = useState<Operation[]>([])
  const [verified, setVerified] = useState<number[]>([])
  const [editing, setEditing] = useState<Operation | null>(null)
  const reviewButton = useRef<HTMLButtonElement | null>(null)
  const reviewOpen = useRef(false)
  const mutation = useMutation({ mutationFn: (execute: () => Promise<unknown>) => execute(), retry: false, networkMode: 'always' })

  function update(change: (current: Operation[]) => Operation[]) {
    records.current = change(records.current)
    setOperations(records.current)
  }

  function setResult(operation: Operation, state?: Operation['state'], error?: unknown, confirmed?: unknown) {
    update(list => list.flatMap(item => item.sequence !== operation.sequence ? [item] : state ? [{ ...item, state, error, confirmed: confirmed ?? item.confirmed }] : []))
  }

  function filter(operation: Operation) {
    const keys = affectedQueries(operation)
    return {
      queryKey: financeKey(account),
      predicate: ({ queryKey }: { queryKey: readonly unknown[] }) =>
        keys.some(key => key === queryKey[2]) && (operation.resource !== 'settings' || queryKey[3] === 'current'),
    }
  }

  function refresh(operation: Operation, verify = false) {
    return client.invalidateQueries({ ...filter(operation), refetchType: verify ? 'all' : 'active' }, { throwOnError: true })
  }

  async function verify(operation: Operation) {
    const signal = operationSignal()
    try {
      await refresh(operation, true)
      if (signal?.aborted || !canAct()) return
      if (operation.resource === 'savings-pots') {
        const movements = queries.transactions(recentTransactionFilters)
        if (!client.getQueryData(movements.queryKey)) await client.fetchQuery(movements)
      }
      if (signal?.aborted || !canAct()) return
      if (operation.state === 'refresh') setResult(operation)
      else setVerified(values => [...values, operation.sequence])
    } catch {
      // The record stays available for another verification attempt.
    }
  }

  const refreshing = useRef(false)

  async function refreshSettled(signal?: AbortSignal) {
    if (refreshing.current || signal?.aborted || !canAct()) return
    const overlaps = (operation: Operation, other: Operation) =>
      affectedQueries(other).some(key => affectedQueries(operation).includes(key))
    const pending = records.current.filter(operation => operation.state === 'pending')
    const ready = records.current.filter(operation => operation.state === 'refreshing' &&
      !pending.some(other => overlaps(operation, other)))
    if (!ready.length) return
    refreshing.current = true
    const match = (query: { queryKey: readonly unknown[] }) => ready.some(operation => filter(operation).predicate(query))
    let succeeded = false
    try {
      await client.cancelQueries({ queryKey: financeKey(account), predicate: match })
      if (signal?.aborted || !canAct()) return
      await client.invalidateQueries({ queryKey: financeKey(account), predicate: match }, { throwOnError: true })
      succeeded = true
    } catch {
      // Keep canonical write results visible when a follow-up read fails.
    } finally {
      if (!signal?.aborted) {
        const inFlight = records.current.filter(operation => operation.state === 'pending')
        const settled = new Set(ready.filter(operation =>
          !inFlight.some(other => overlaps(operation, other))).map(operation => operation.sequence))
        update(list => list.flatMap(operation => settled.has(operation.sequence)
          ? succeeded ? [] : [{ ...operation, state: 'refresh' as const }]
          : [operation]))
      }
      refreshing.current = false
      if (!signal?.aborted) void refreshSettled(signal)
    }
  }

  function submit<Result>(options: SaveOptions<Result>, execute: (signal?: AbortSignal) => Promise<Result>, replace?: number) {
    if (!canAct()) return false
    const intent = options.intent
    if (intent?.resource === 'budgets' && intent.action === 'save' && records.current.some(entry =>
      entry.intent?.resource === 'budgets' && entry.intent.action === 'save' &&
      entry.intent.value.categoryId === intent.value.categoryId &&
      (entry.state === 'pending' || entry.state === 'uncertain'))) return false
    if (options.id && records.current.some(item => item.resource === options.resource && item.id === options.id &&
      (item.state === 'pending' || item.state === 'uncertain'))) return false
    const signal = operationSignal()
    const sequence = ++next.current
    const keys = affectedQueries(options)
    const baselines = new Map(client.getQueriesData({
      queryKey: financeKey(account),
      predicate: query => keys.some(key => key === query.queryKey[2]),
    }).map(
      ([key, data]) => [hashKey(key.slice(2)), data],
    ))
    const operation: Operation = { ...options, sequence, baselines, key: `local:${sequence}`, state: 'pending' }
    update(list => [...list.filter(item => item.sequence !== replace), operation])

    async function run() {
      let result: Result
      try {
        result = await execute(signal)
      } catch (error) {
        if (signal?.aborted || !await whenVerified() || !canAct()) return
        const rejected = error instanceof ApiError && [400, 403, 404, 409].includes(error.status)
        setResult(operation, rejected ? 'rejected' : 'uncertain', error)
        if (rejected && error.status === 409 && operation.intent) void refresh(operation).catch(() => {})
        void refreshSettled(signal)
        return
      }
      const receivedAt = Date.now()
      if (signal?.aborted || !await whenVerified() || !canAct()) return
      if (!operation.id && result && typeof result === 'object' && 'id' in result && typeof result.id === 'string') {
        const recordId = result.id
        setRecordKeys(keys => new Map(keys).set(operation.resource + ':' + recordId, operation.key))
      }
      setResult(operation, 'refreshing', undefined, result)
      options.onConfirmed?.(result, receivedAt)
      const warnings = result && typeof result === 'object' && 'budgetWarnings' in result
        ? result.budgetWarnings as BudgetWarning[] : []
      notify({ warnings })
      await refreshSettled(signal)
    }
    mutation.mutate(run)
    return true
  }

  return <OperationsContext.Provider value={{ operations, submit, recordKeys }}>
    {children}
    {operations.some(showOperation) && <section aria-label={t('Pending changes')} className="sticky bottom-0 z-10 grid max-h-[40dvh] gap-100 overflow-auto rounded-none bg-card p-150">
      {operations.filter(showOperation).map(operation => <div className="flex flex-wrap items-center gap-100" key={operation.sequence}>
        <p role={operation.state === 'pending' ? 'status' : 'alert'}>
          {t(operation.label)}{operation.name ? ' · ' + operation.name : ''} · {t(operation.state === 'pending' ? 'Pending confirmation' :
            operation.state === 'refresh' ? 'Could not load data. Please retry.' :
            operation.label === 'Undo' && operation.error instanceof ApiError && operation.error.status === 409 ? 'The undo window has expired.' : errorLabel(operation.error, operation.resource === 'categories' && operation.label === 'Delete'))}
        </p>
        {(operation.state === 'uncertain' || operation.state === 'refresh') &&
          <Button type="button" variant="secondary" disabled={phase !== 'active'} onClick={() => void verify(operation)}>{t('Verify')}</Button>}
        {operation.state === 'uncertain' && verified.includes(operation.sequence) &&
          <Button type="button" variant="secondary" onClick={() => setResult(operation)}>{t('Dismiss review')}</Button>}
        {operation.state === 'rejected' && operation.editor &&
          <Button type="button" variant="secondary" disabled={phase !== 'active'} onClick={event => {
            reviewButton.current = event.currentTarget
            reviewOpen.current = true
            setEditing(operation)
          }}>{t('Review draft')}</Button>}
      </div>)}
    </section>}
    {editing && <Dialog open={phase === 'active'} onOpenChange={open => {
      if (!open) { reviewOpen.current = false; setEditing(null) }
    }}>
      <DialogContent style={concealed ? { visibility: 'hidden' } : undefined} className="max-w-[calc(100%-32px)] max-h-[90dvh] overflow-y-auto" onCloseAutoFocus={event => {
        event.preventDefault()
        const target = reviewButton.current?.isConnected ? reviewButton.current : document.querySelector<HTMLElement>('main h1')
        target?.focus({ preventScroll: true })
      }}>
        <DialogHeader><DialogTitle>{t(editing.label)}</DialogTitle><DialogDescription>{t('Review draft')}</DialogDescription></DialogHeader>
        <DraftContext.Provider value={editing}>
          <DialogSaveContext.Provider value={{ begin: () => reviewOpen.current, fail: () => {}, complete: () => {
            reviewOpen.current = false
            setEditing(null)
          } }}>{editing.editor}</DialogSaveContext.Provider>
        </DraftContext.Provider>
      </DialogContent>
    </Dialog>}
  </OperationsContext.Provider>
}

export function useSave<Result>(prepare: () => (signal?: AbortSignal) => Promise<Result>, options: SaveOptions<Result>) {
  const { refresh, canAct, phase } = useFinance()
  const operations = useContext(OperationsContext)
  const dialog = useContext(DialogSaveContext)
  const recovered = useContext(DraftContext)
  const [error, setError] = useState<unknown>(recovered?.error ?? null)
  const [duplicate, setDuplicate] = useState(false)
  const submitted = useRef(false)
  function submit() {
    if (!canAct() || submitted.current) return
    let work: ReturnType<typeof prepare>
    try {
      work = prepare()
    } catch (cause) {
      setError(cause)
      return
    }
    if (dialog && !dialog.begin()) return
    if (!operations?.submit(options, work, recovered?.sequence)) {
      setDuplicate(true)
      dialog?.fail()
      return
    }
    submitted.current = Boolean(dialog)
    setError(null)
    dialog?.complete()
  }
  return { submit, error, duplicate, blocked: phase !== 'active', refresh }
}

export function SaveForm({save,children,category=false,submitLabel='Save',className,destructive=false}:{save:ReturnType<typeof useSave>;children:ReactNode;category?:boolean;submitLabel?:Label;className?:string;destructive?:boolean}) {
  const {t}=useI18n()
  const form = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (save.error instanceof ApiError && save.error.status === 400) form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [save.error])
  return <form ref={form} noValidate className={cn('grid gap-200',className)} onSubmit={event=>{event.preventDefault();save.submit()}}>
    <fieldset disabled={save.blocked} className="grid gap-[inherit] min-w-0">{children}</fieldset>
    {save.duplicate && <p role="alert">{t('Another change for this record is pending.')}</p>}
    {Boolean(save.error) && <div role="alert" className="grid gap-100 text-red"><p>{t(errorLabel(save.error,category))}</p>{!(save.error instanceof ApiError && save.error.status === 400) && <Button type="button" disabled={save.blocked} variant="secondary" onClick={()=>void save.refresh()}>{t('Reload data')}</Button>}</div>}
    <Button type="submit" disabled={save.blocked} variant={destructive ? 'destroy' : undefined} className="text-ink">{t(submitLabel)}</Button>
    <SessionRetry />
  </form>
}

function useEditorDialog() {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const busy = useRef(false)
  const completed = useRef(false)

  function release() {
    busy.current = false
    setSaving(false)
  }

  const save: DialogSave = {
    begin() {
      if (busy.current || !open) return false
      busy.current = true
      setSaving(true)
      return true
    },
    fail: release,
    complete() {
      completed.current = true
      setOpen(false)
    },
  }
  return {
    open, save,
    setOpen(next: boolean) { if (!busy.current) setOpen(next) },
    content: {
      closeDisabled: saving,
      onEscapeKeyDown(event: KeyboardEvent) { if (busy.current) event.preventDefault() },
      onInteractOutside(event: Event) { if (busy.current) event.preventDefault() },
    },
    finishClose(event: Event, opener: HTMLButtonElement | null, deleted = false) {
      event.preventDefault()
      const focusTarget = (!deleted || !completed.current) && opener?.isConnected
        ? opener
        : document.querySelector<HTMLElement>('main h1')
      focusTarget?.focus({ preventScroll: true })
      completed.current = false
      release()
    },
  }
}

const contentWidth = 'max-w-[calc(100%_-_32px)] md:max-w-lg max-h-[90dvh] overflow-y-auto'

export function NewDialog({title,children,buttonLabel,prefix=true,variant,heading,description,contentClassName,renderTrigger}:{title:Label;children:ReactNode;buttonLabel?:Label;prefix?:boolean;variant?:ComponentProps<typeof Button>['variant'];heading?:ReactNode;description?:Label;contentClassName?:string;renderTrigger?:(open:() => void, ref:RefCallback<HTMLButtonElement>, isOpen:boolean) => ReactNode}) {
  const dialog = useEditorDialog()
  const concealed = useAccountSession()?.concealed
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null)
  const { t } = useI18n()
  return <Dialog open={dialog.open} onOpenChange={dialog.setOpen}>
    {renderTrigger ? renderTrigger(() => dialog.setOpen(true), setTrigger, dialog.open) : <DialogTrigger asChild><Button ref={setTrigger} variant={variant} className={variant ? '' : 'text-ink'}>{prefix ? '+ ' : ''}{t(buttonLabel ?? title)}</Button></DialogTrigger>}
    <DialogContent style={concealed ? { visibility: 'hidden' } : undefined} className={cn(contentWidth, contentClassName)} {...dialog.content} onCloseAutoFocus={event => dialog.finishClose(event, trigger)}>
      <DialogHeader className={contentClassName ? 'grid justify-start gap-250' : undefined}>
        <DialogTitle className={cn(contentClassName && 'text-start',heading && 'text-start text-preset-2 text-ink')}>{heading ?? t(title)}</DialogTitle>
        <DialogDescription className={description ? 'text-start text-preset-4 text-ink-muted' : 'sr-only'}>{t(description ?? title)}</DialogDescription>
      </DialogHeader>
      <DialogSaveContext.Provider value={dialog.save}>{children}</DialogSaveContext.Provider>
    </DialogContent>
  </Dialog>
}

export function RowActions({name,recordId,edit,remove,extra,contentClassName}:{name:string;recordId:string;edit:ReactNode;remove:ReactNode;extra?:{label:Label;content:ReactNode};contentClassName?:string}) {
  const [action, setAction] = useState<'edit' | 'delete' | 'extra'>('edit')
  const dialog = useEditorDialog()
  const concealed = useAccountSession()?.concealed
  const trigger = useRef<HTMLButtonElement>(null)
  const { t } = useI18n()
  function select(next: typeof action) {
    setAction(next)
    dialog.setOpen(true)
  }
  return <>
    <DropdownMenu><DropdownMenuTrigger ref={trigger} aria-label={`${t('Actions')}: ${name} (#${recordId})`} className="flex min-h-[44px] min-w-[44px] items-center justify-center"><DotsThreeOutline size={20} weight="fill"/></DropdownMenuTrigger><DropdownMenuContent className="rounded-none bg-card px-250 py-150" onCloseAutoFocus={event => { if (dialog.open) event.preventDefault() }}>
      <DropdownMenuItem onSelect={() => select('edit')}>{t('Edit')}</DropdownMenuItem><DropdownMenuSeparator/>
      {extra && <><DropdownMenuItem onSelect={() => select('extra')}>{t(extra.label)}</DropdownMenuItem><DropdownMenuSeparator/></>}
      <DropdownMenuItem className="text-red" onSelect={() => select('delete')}>{t('Delete')}</DropdownMenuItem>
    </DropdownMenuContent></DropdownMenu>
    <Dialog open={dialog.open} onOpenChange={dialog.setOpen}>
      <DialogContent style={concealed ? { visibility: 'hidden' } : undefined} className={cn(contentWidth, contentClassName)} {...dialog.content} onCloseAutoFocus={event => dialog.finishClose(event, trigger.current, action === 'delete')}>
        <DialogHeader className={contentClassName ? 'grid justify-start gap-250' : undefined}>
          <DialogTitle className={cn('break-words',contentClassName && 'text-start',contentClassName && action === 'delete' && 'text-preset-2')}>{t(action === 'edit' ? 'Edit' : action === 'delete' ? 'Delete' : extra?.label ?? 'Actions')}: {name}</DialogTitle>
          <DialogDescription className="sr-only">{name}</DialogDescription>
        </DialogHeader>
        <DialogSaveContext.Provider value={dialog.save}>{action === 'edit' ? edit : action === 'delete' ? remove : extra?.content}</DialogSaveContext.Provider>
      </DialogContent>
    </Dialog>
  </>
}

export function ConfirmForm({description,save,category=false}:{description:Label;save:ReturnType<typeof useSave>;category?:boolean}) {
  const {t}=useI18n()
  return <><SaveForm save={save} category={category} destructive={!category} submitLabel="Yes, Confirm Deletion"><p className="text-preset-4 text-ink-muted">{t('Confirm deletion?')}</p><p className="text-preset-4 text-ink-muted">{t(description)}</p></SaveForm>{!category && <DialogClose className="text-preset-4 text-ink-muted">{t('No, I want to go back')}</DialogClose>}</>
}
