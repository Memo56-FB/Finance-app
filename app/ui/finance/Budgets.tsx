'use client'
import { CardsSkeleton, FieldSkeleton, LoadingRegion, RowsSkeleton } from './Loading'
import { CalendarField } from './CalendarField'
import Link from '@/app/ui/finance/FinanceLink'
import { useQuery } from '@tanstack/react-query'
import { useId } from 'react'
import type { ReactNode, RefCallback } from 'react'
import { CaretDown, Plus } from '@phosphor-icons/react/dist/ssr'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { categoryOptions } from '@/lib/finance/categories'
import { CategoryForm } from './Categories'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/Progress'
import { SpendingSummary } from '@/app/ui/budgets/SpendingSummary'
import { useFinance } from '@/lib/finance/AccountScope'
import { financeKey } from '@/lib/finance/queries'
import { recentExpenses } from '@/lib/finance/recent-expenses'
import { cents, moneyRatio } from '@/lib/finance/money'
import { validMonth } from '@/lib/api/finance-path'
import { Money, useI18n } from '@/lib/i18n/client'
import type { Budget } from '@/lib/finance/types'
import type { BudgetView } from '@/lib/finance/optimistic'
import { Skeleton } from '@/components/ui/skeleton'
import { validId } from '@/lib/api/finance-json'
import { colorHex } from '@/lib/finance/colors'
import { validAmount } from '@/lib/finance/money'
import { saveRecord } from '@/lib/finance/services'
import { SaveForm, useDraftField, useSave } from './common'
import { AmountHelp, CategoryField, ColorField, useFieldError, validate } from './form-fields'
import { DeleteForm } from './DeleteForm'
import { Empty, financeDialog, FormInput, NewDialog, PageHeader, panel, QueryMessage, RowActions, useBudgetView, useCategoryView, useRecentExpenseView } from './common'
import { TransactionRows, useFinancialURL } from './Transactions'

export function MonthControl({effective,onMonthChange}:{effective?:string;onMonthChange?:(value:string)=>void}) {
  const {params,update}=useFinancialURL()
  const currentMonth=effective ?? new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit'}).format(new Date())
  return <div className="flex"><CalendarField label="Month" monthOnly value={validMonth(params.get('month') ?? '') ? params.get('month')! : currentMonth} onChange={value => onMonthChange ? onMonthChange(value) : update('month',value)}/></div>
}
function LatestExpenseRows({budget}:{budget:Budget}) {
  const { account, phase } = useFinance()
  const query = useQuery({
    queryKey: [...financeKey(account), 'budget-expenses', budget.categoryId, budget.month],
    queryFn: ({ signal }) => recentExpenses(budget.categoryId, budget.month, signal),
    staleTime: Infinity,
    gcTime: 0,
    enabled: phase === 'active',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
  const rows = useRecentExpenseView(query.data, budget.categoryId, budget.month)
  return <>
    <QueryMessage query={query} fallback={rows ? null : <RowsSkeleton count={3}/>}/>
    {rows && (rows.length ? <TransactionRows rows={rows} showCategory/> : <Empty label="No recent expenses."/>)}
  </>
}
function LatestExpenses({budget}:{budget:Budget}) {
  const { t } = useI18n()
  return <section className="grid gap-250 rounded-xl bg-beige-100 p-200">
    <header className="flex flex-wrap justify-between gap-100">
      <h3 className="text-preset-3">{t('Latest Spending')}</h3>
      <Button variant="tertiary" asChild><Link href={'/finance/transactions?'+new URLSearchParams({category:budget.categoryId})}>{t('See All')}</Link></Button>
    </header>
    {cents(budget.spent) === 0n ? <Empty label="No recent expenses."/> : <LatestExpenseRows budget={budget}/>}
  </section>
}
function BudgetCard({budget}:{budget:BudgetView}) {
  const {t}=useI18n()
  const record = validId(budget.id) && budget.spent !== null && budget.available !== null
    ? { ...budget, spent: budget.spent, available: budget.available }
    : undefined
  return <article className={panel}><header className="flex items-center justify-between gap-150"><div className="flex items-center gap-200 min-w-0"><span className="h-4 w-4 shrink-0 rounded-full" style={{backgroundColor:budget.color}}/><h2 className="text-preset-2 break-words [overflow-wrap:anywhere]">{budget.categoryName}</h2></div>{record && <RowActions name={budget.categoryName} recordId={budget.id} contentClassName={financeDialog} edit={<BudgetForm record={record}/>} remove={<DeleteForm resource="budgets" id={budget.id} name={budget.categoryName}/>}/>}</header>
    <div className="grid gap-200"><p className="text-preset-4 text-grey-500 break-all">{t('Maximum of')} <Money value={budget.spendingLimit}/></p>{budget.spent === null ? <Skeleton className="h-2 w-full"/> : <Progress aria-label={`${budget.categoryName} ${t('spending')}`} max={100} value={moneyRatio(budget.spent,budget.spendingLimit)} color={budget.color}/>}
    <dl className="grid grid-cols-2 gap-200"><div className="flex gap-200"><span className="h-full w-1 shrink-0 rounded-lg" style={{backgroundColor:budget.color}}/><div className="grid gap-50 min-w-0"><dt className="text-preset-5 text-grey-500">{t('Spent')}</dt><dd className="text-preset-4-bold break-all">{budget.spent === null ? <Skeleton className="h-4 w-16"/> : <Money value={budget.spent}/>}</dd></div></div><div className="flex gap-200"><span className="h-full w-1 shrink-0 rounded-lg bg-beige-100"/><div className="grid gap-50 min-w-0"><dt className="text-preset-5 text-grey-500">{t('Free')}</dt><dd className="text-preset-4-bold break-all">{budget.available === null ? <Skeleton className="h-4 w-16"/> : <Money value={budget.available}/>}</dd></div></div></dl></div>
    {budget.limitReached && <p className="text-preset-5 text-red">{t('Budget limit reached.')} {t('Budget exceeded by')} <Money value={budget.exceededAmount}/></p>}{record ? <LatestExpenses budget={record}/> : <LoadingRegion><Skeleton className="h-16 w-full"/></LoadingRegion>}
  </article>
}
export function Budgets() {
  const {queries}=useFinance(),{params}=useFinancialURL(),month=params.get('month') ?? '',query=useQuery(queries.budgets(validMonth(month) ? month : undefined))
  const items = useBudgetView(query.data, validMonth(month) ? month : undefined)
  return <><PageHeader title="Budgets"><NewDialog title="Add New Budget" contentClassName={financeDialog}>{<BudgetForm/>}</NewDialog></PageHeader><MonthControl effective={query.data?.items[0]?.month}/><QueryMessage query={query} fallback={items ? null : <CardsSkeleton chart/>}/>{items && (items.length ? <section className="grid grid-cols-1 items-start gap-300 lg:grid-cols-2">
    <SpendingSummary items={items}/>
    <div className="grid min-w-0 gap-300">
      {items.map(budget=><BudgetCard key={budget.localKey ?? budget.id} budget={budget}/>)}
    </div>
  </section> : <section className={panel}><Empty label="No budgets yet."/></section>)}</>
}

function BudgetCategoryPicker({ options, value, onChange, onAdd, triggerRef, categoryDialogOpen, error }: {
  options: ReturnType<typeof categoryOptions>
  value: string
  onChange: (value: string) => void
  onAdd: () => void
  triggerRef: RefCallback<HTMLButtonElement>
  categoryDialogOpen: boolean
  error?: string
}) {
  const id = useId()
  const { t } = useI18n()
  const selected = options.find(option => option.value === value)
  return <div className="grid min-w-0 gap-50">
    <label htmlFor={id} className="text-preset-5-bold text-grey-500">{t('Category')}</label>
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger id={id} ref={triggerRef} type="button"
        className="flex h-[45px] w-full items-center justify-between gap-200 rounded-md border border-beige-500 bg-background px-250 text-left text-preset-4 text-grey-900 hover:border-grey-900 focus-visible:ring-2 focus-visible:ring-ring"
        aria-invalid={!!error || undefined} aria-describedby={error ? id + '-error' : undefined}>
        <span className="truncate">{selected?.label ?? t('Category')}</span>
        <CaretDown aria-hidden size={16} weight="fill" className="shrink-0"/>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[var(--radix-dropdown-menu-content-available-height)] w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto"
        onCloseAutoFocus={event => { if (categoryDialogOpen) event.preventDefault() }}>
        {options.length > 0 && <>
          <DropdownMenuRadioGroup value={selected?.value ?? ''} onValueChange={onChange}>
            {options.map(option => <DropdownMenuRadioItem key={option.value} value={option.value} className="break-words [overflow-wrap:anywhere]">{option.label}</DropdownMenuRadioItem>)}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator/>
        </>}
        <DropdownMenuItem asChild onSelect={onAdd}>
          <button type="button" className="min-h-11 w-full gap-100 text-left">
            <Plus size={16} aria-hidden/>{t('Add a category')}
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    {error && <p id={id + '-error'} className="text-preset-5 text-red">{error}</p>}
  </div>
}

function BudgetForm({ record }: { record?: Budget }) {
  const { t } = useI18n()
  const { queries } = useFinance()
  const budgets = useQuery(queries.budgets())
  const categories = useQuery(queries.categories())
  const categoryRows = useCategoryView(categories.data)
  const visibleBudgets = useBudgetView(budgets.data)
  const usedCategories = new Set(visibleBudgets?.filter(budget => budget.id !== record?.id).map(budget => budget.categoryId))
  const [categoryId, setCategory] = useDraftField('categoryId', record?.categoryId ?? '')
  const activeCategory = categoryRows?.find(category => category.id === categoryId)
  const canUseCategory = validId(categoryId) && !usedCategories.has(categoryId) && Boolean(activeCategory || record?.categoryId === categoryId)
  const [limit, setLimit] = useDraftField('spendingLimit', record?.spendingLimit ?? '')
  const [color, setColor] = useDraftField('color', record?.color ?? colorHex.green)
  const save = useSave(() => {
    validate({ categoryId: !!budgets.data && canUseCategory, spendingLimit: validAmount(limit), color: /^#[\da-f]{6}$/i.test(color) })
    return signal => saveRecord('budgets', { categoryId, spendingLimit: limit, color }, record?.id, signal)
  }, {
    resource: 'budgets', id: record?.id, label: record ? 'Edit' : 'Add Budget',
    name: record?.categoryName, draft: { categoryId, spendingLimit: limit, color }, editor: <BudgetForm record={record} />,
    intent: { resource: 'budgets', action: 'save', before: record, value: {
      categoryId, categoryName: activeCategory?.name ?? record?.categoryName ?? '',
      spendingLimit: limit, color,
    } },
  })
  const error = useFieldError(save.error)
  function renderForm(categoryField: ReactNode) {
    return <SaveForm save={save} submitLabel={record ? 'Save Changes' : 'Add Budget'}>
      <p className="text-preset-4 text-grey-500">{t('Choose a category to set a spending budget.')}</p>
      <QueryMessage query={budgets} fallback={<FieldSkeleton/>}/>
      {budgets.data && categoryField}
      <FormInput label="Maximum Spending" money inputMode="decimal" placeholder={t('e.g. 2000')} value={limit} onChange={e => setLimit(e.target.value)} error={error('spendingLimit')} required/>
      <AmountHelp/>
      <ColorField value={color} onChange={setColor}/>
    </SaveForm>
  }

  if (record) return renderForm(<CategoryField value={canUseCategory ? categoryId : ''} onChange={setCategory}
    original={{id: record.categoryId, name: record.categoryName}} excludedIds={usedCategories} error={error('categoryId')}/>)

  const options = categoryOptions((categoryRows ?? []).filter(category => validId(category.id)))
    .filter(option => !usedCategories.has(option.value))
  return <NewDialog title="Add category" renderTrigger={(open, triggerRef, isOpen) => renderForm(<>
    <QueryMessage query={categories} fallback={categoryRows ? null : <FieldSkeleton/>}/>
    {(categoryRows || !categories.isPending) && <BudgetCategoryPicker options={options} value={categoryId}
      onChange={setCategory} onAdd={open} triggerRef={triggerRef} categoryDialogOpen={isOpen} error={error('categoryId')}/>}
  </>)}>
    <CategoryForm/>
  </NewDialog>
}
