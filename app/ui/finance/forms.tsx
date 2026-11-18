'use client'
import { useId, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/client'
import { validId } from '@/lib/api/finance-json'
import { useFinance } from '@/lib/finance/AccountScope'
import { calendarDate } from '@/lib/finance/contracts'
import type { Resource } from '@/lib/finance/contracts'
import { cents, decimal, moneyRatio, validAmount } from '@/lib/finance/money'
import { colorHex } from '@/lib/finance/colors'
import { deleteRecord, movePot, payRecurring, saveRecord, saveSettings } from '@/lib/finance/services'
import type { Budget, Category, CutSettings, Pot, PotDeletion, RecurringPayment, Transaction } from '@/lib/finance/types'
import { Money, Percentage, useI18n } from '@/lib/i18n/client'
import { ProgressDiff } from '@/components/ui/ProgressDiff'
import { SelectColorTag } from '@/components/ui/SelectColorTag'
import { colorTags } from '@/lib/utils'
import { ConfirmForm, FormInput, FormSelect, QueryMessage, SaveForm, useSave } from './common'

function validate(fields: Record<string, boolean>) { const invalid = Object.keys(fields).filter(key => !fields[key]); if (invalid.length) throw new ApiError(400, invalid) }
function nameValid(name: string) { return name.trim().length > 0 && name.trim().length <= 100 }
function useFieldError(error: unknown) {
  const { t } = useI18n()
  return (field: string) => error instanceof ApiError && error.fields.includes(field) ? t(field === 'name' ? 'Review your name (1–100 characters).' : field === 'amount' || field === 'spendingLimit' || field === 'targetAmount' ? 'Enter a valid amount, up to 17 digits and 2 decimals.' : 'Please review the marked fields.') : undefined
}
export function categoryOptions(categories: Category[]) {
  const counts = new Map<string, number>()
  categories.forEach(item => counts.set(item.name, (counts.get(item.name) ?? 0) + 1))
  return categories.map(item => ({ value: item.id, label: counts.get(item.name)! > 1 ? `${item.name} (#${item.id})` : item.name }))
}
function CategoryField({ value, onChange, original, error, nullable = false }: { value: string; onChange: (value: string) => void; original?: { id: string; name: string }; error?: string; nullable?: boolean }) {
  const { queries } = useFinance(), query = useQuery(queries.categories()), { t } = useI18n()
  const options = categoryOptions(query.data?.items ?? [])
  if (original && !options.some(option => option.value === original.id)) options.push({ value: original.id, label: `${original.name} (${t('Inactive category')})` })
  if (nullable) options.unshift({ value: 'none', label: t('No category') })
  return <><QueryMessage query={query} /><FormSelect label="Category" value={value} onChange={onChange} options={options} error={error} />{!query.isPending && !options.length && <p className="text-preset-5">{t('Choose an active category.')}</p>}</>
}
function ColorField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const id = useId(), { t } = useI18n()
  return <div className="grid gap-50"><label htmlFor={id} className="text-preset-5-bold text-grey-500">{t('Color Tag')}</label><SelectColorTag id={id} value={value} onValueChange={onChange} options={colorTags.map(option => ({ ...option, value: colorHex[option.value] }))} /></div>
}
function AmountHelp() { return <p className="text-preset-5 text-grey-500">{useI18n().t('Use a decimal point without thousands separators.')}</p> }

export function CategoryForm({ record, onDone }: { record?: Category; onDone: () => void }) {
  const [name, setName] = useState(record?.name ?? '')
  const save = useSave(async () => { validate({ name: nameValid(name) }); return saveRecord('categories', { name: name.trim() }, record?.id) }, onDone)
  const error = useFieldError(save.error)
  return <SaveForm save={save}><FormInput label="Name" value={name} onChange={event => setName(event.target.value)} maxLength={100} error={error('name')} required /></SaveForm>
}
export function TransactionForm({ record, onDone }: { record?: Transaction; onDone: () => void }) {
  const { t } = useI18n()
  const [name, setName] = useState(record?.name ?? ''), [categoryId, setCategory] = useState(record?.categoryId ?? (record?.sourceType === 'POT' ? 'none' : '')), [date, setDate] = useState(record?.transactionDate ?? ''), [amount, setAmount] = useState(record?.amount.replace(/^-/, '') ?? '')
  const [sign, setSign] = useState(record?.amount.startsWith('-') || !record ? 'expense' : 'income')
  const nullable = record?.sourceType === 'POT'
  const save = useSave(async () => {
    validate({ name: nameValid(name), categoryId: validId(categoryId) || nullable && categoryId === 'none', transactionDate: calendarDate(date), amount: validAmount(amount) })
    return saveRecord('transactions', { name: name.trim(), categoryId: categoryId === 'none' ? null : categoryId, transactionDate: date, amount: (sign === 'expense' ? '-' : '') + amount }, record?.id)
  }, onDone)
  const error = useFieldError(save.error)
  return <SaveForm save={save}>
    {record && record.sourceType !== 'MANUAL' && <p className="text-preset-4 text-grey-500">{t('This correction can change a linked pot balance or payment status.')}</p>}
    <FormInput label="Name" value={name} onChange={e => setName(e.target.value)} maxLength={100} error={error('name')} required />
    <CategoryField value={categoryId || (nullable ? 'none' : '')} onChange={setCategory} original={record?.categoryId ? { id: record.categoryId, name: record.categoryName ?? '' } : undefined} nullable={nullable} error={error('categoryId')} />
    <FormInput label="Transaction Date" type="date" value={date} onChange={e => setDate(e.target.value)} error={error('transactionDate')} required />
    <FormSelect label="Transaction type" value={sign} onChange={setSign} options={[{ value: 'income', label: t('Income') }, { value: 'expense', label: t('Expense') }]} />
    <FormInput label="Amount" money inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} error={error('amount')} required /><AmountHelp />
  </SaveForm>
}
export function BudgetForm({ record, onDone }: { record?: Budget; onDone: () => void }) {
  const { t } = useI18n()
  const [categoryId, setCategory] = useState(record?.categoryId ?? ''), [limit, setLimit] = useState(record?.spendingLimit ?? ''), [color, setColor] = useState(record?.color ?? colorHex.green)
  const save = useSave(async () => { validate({ categoryId: validId(categoryId), spendingLimit: validAmount(limit), color: /^#[\da-f]{6}$/i.test(color) }); return saveRecord('budgets', { categoryId, spendingLimit: limit, color }, record?.id) }, onDone)
  const error = useFieldError(save.error)
  return <SaveForm save={save} submitLabel={record ? 'Save Changes' : 'Add Budget'}><p className="text-preset-4 text-grey-500">{t('Choose a category to set a spending budget.')}</p><CategoryField value={categoryId} onChange={setCategory} error={error('categoryId')} /><FormInput label="Maximum Spending" money inputMode="decimal" placeholder={t('e.g. 2000')} value={limit} onChange={e => setLimit(e.target.value)} error={error('spendingLimit')} required /><AmountHelp /><ColorField value={color} onChange={setColor} /></SaveForm>
}
export function PotForm({ record, onDone }: { record?: Pot; onDone: () => void }) {
  const [name, setName] = useState(record?.name ?? ''), [target, setTarget] = useState(record?.targetAmount ?? ''), [color, setColor] = useState(record?.color ?? colorHex.green)
  const save = useSave(async () => { validate({ name: nameValid(name), targetAmount: validAmount(target), color: /^#[\da-f]{6}$/i.test(color) }); return saveRecord('savings-pots', { name: name.trim(), targetAmount: target, color }, record?.id) }, onDone)
  const error = useFieldError(save.error)
  const { t } = useI18n()
  return <SaveForm save={save} submitLabel={record ? 'Save Changes' : 'Add Pot'}><p className="text-preset-4 text-grey-500">{t(record ? 'Preview changes to your savings target.' : 'Create a pot to set savings targets.')}</p><div className="grid gap-50"><FormInput label="Pot Name" value={name} placeholder={t('e.g. Rainy Days')} onChange={e => setName(e.target.value)} maxLength={100} error={error('name')} required /><span className="text-right text-preset-5 text-grey-500">{100 - name.length} {t('Characters left')}</span></div><FormInput label="Target" money inputMode="decimal" placeholder={t('e.g. 2000')} value={target} onChange={e => setTarget(e.target.value)} error={error('targetAmount')} required /><AmountHelp /><ColorField value={color} onChange={setColor} /></SaveForm>
}
export function PotMoneyForm({ record, action, onDone }: { record: Pot; action: 'deposits' | 'withdrawals'; onDone: () => void }) {
  const [amount, setAmount] = useState('0'), { t, money } = useI18n()
  const change = validAmount(amount) ? cents(amount) * (action === 'withdrawals' ? -1n : 1n) : 0n
  const nextAmount = decimal(cents(record.balance) + change)
  const currentProgress = moneyRatio(record.balance, record.targetAmount)
  const nextProgress = moneyRatio(nextAmount, record.targetAmount)
  const save = useSave(async () => {
    validate({ amount: validAmount(amount) })
    if (action === 'withdrawals' && cents(amount) > cents(record.balance)) throw new ApiError(400, ['amount'])
    return movePot(record.id, action, amount)
  }, onDone)
  const error = useFieldError(save.error)
  return <SaveForm save={save} className="gap-250" submitLabel={action === 'deposits' ? 'Confirm Addition' : 'Confirm Withdrawal'}>
    <section className="grid gap-150" aria-label={`${record.name} ${t(action === 'deposits' ? 'savings preview' : 'withdrawal preview')}`}>
      <div className="flex flex-wrap items-center justify-between gap-200"><p className="text-preset-5 text-grey-500">{t('New Amount')}</p><p className="text-preset-1 text-grey-900 break-all"><Money value={nextAmount} /></p></div>
      <div className="grid grid-cols-2 gap-150"><ProgressDiff aria-label={`${record.name} ${t(action === 'deposits' ? 'savings preview' : 'withdrawal preview')}`} aria-valuetext={money(nextAmount)} max={100} currentValue={currentProgress} incomingValue={nextProgress - currentProgress} color={action === 'deposits' ? record.color : 'red'} className="col-span-2" /><p className={`text-preset-5-bold ${action === 'deposits' ? 'text-green' : 'text-red'}`}><Percentage value={nextProgress / 100} /></p><p className="text-right text-preset-5 text-grey-500 break-all">{t('Target of')} <Money value={record.targetAmount} /></p></div>
    </section>
    <FormInput label={action === 'deposits' ? 'Amount to Add' : 'Amount to Withdraw'} money inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} error={validAmount(amount) && action === 'withdrawals' && cents(amount) > cents(record.balance) ? t('Insufficient funds.') : error('amount')} required /><AmountHelp />
  </SaveForm>
}
export function RecurringForm({ record, onDone }: { record?: RecurringPayment; onDone: () => void }) {
  const { t } = useI18n(), [name, setName] = useState(record?.name ?? ''), [categoryId, setCategory] = useState(record?.categoryId ?? ''), [amount, setAmount] = useState(record?.amount ?? ''), [type, setType] = useState<string>(record?.type ?? 'SUBSCRIPTION'), [date, setDate] = useState(record?.firstDueDate ?? ''), [count, setCount] = useState(String(record?.totalInstallments ?? ''))
  const save = useSave(async () => {
    validate({ name: nameValid(name), categoryId: validId(categoryId), amount: validAmount(amount), firstDueDate: calendarDate(date), totalInstallments: type === 'SUBSCRIPTION' || /^[1-9]\d*$/.test(count) && BigInt(count) <= 2147483647n })
    return saveRecord('recurring-payments', { name: name.trim(), categoryId, amount, type, firstDueDate: date, ...(type === 'INSTALLMENT' ? { totalInstallments: count } : {}) }, record?.id)
  }, onDone)
  const error = useFieldError(save.error)
  return <SaveForm save={save}><FormInput label="Name" value={name} onChange={e => setName(e.target.value)} maxLength={100} error={error('name')} required /><CategoryField value={categoryId} onChange={setCategory} error={error('categoryId')} /><FormSelect label="Payment type" value={type} onChange={setType} options={[{ value: 'SUBSCRIPTION', label: t('Subscription') }, { value: 'INSTALLMENT', label: t('Installments') }]} /><FormInput label="Per payment" money inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} error={error('amount')} required /><AmountHelp /><FormInput label="First due date" type="date" value={date} onChange={e => setDate(e.target.value)} error={error('firstDueDate')} required />{type === 'INSTALLMENT' && <FormInput label="Number of installments" inputMode="numeric" value={count} onChange={e => setCount(e.target.value)} error={error('totalInstallments')} required />}</SaveForm>
}
export function CutForm({ record, onDone }: { record: CutSettings; onDone: () => void }) {
  const { t } = useI18n(), [frequency, setFrequency] = useState<string>(record.frequency), [day, setDay] = useState(String(record.startDay))
  const save = useSave(async () => { validate({ startDay: /^\d+$/.test(day) && Number(day) >= 1 && Number(day) <= 31 }); return saveSettings({ frequency, startDay: day }) }, onDone)
  const error = useFieldError(save.error)
  return <SaveForm save={save}><FormSelect label="Frequency" value={frequency} onChange={setFrequency} options={[{ value: 'MONTHLY', label: t('Monthly') }, { value: 'SEMIMONTHLY', label: t('Semimonthly') }]} /><FormInput label="Start day" inputMode="numeric" value={day} onChange={e => setDay(e.target.value)} error={error('startDay')} /><p className="text-preset-5">{t('Choose a day from 1 to 31.')}</p></SaveForm>
}
export function DeleteForm({ resource, id, onDone, onDeleted }: { resource: Resource; id: string; onDone: () => void; onDeleted?: (result: PotDeletion) => void }) {
  const save = useSave(async () => { const result = await deleteRecord(resource, id); if (result) onDeleted?.(result); return result }, onDone)
  return <ConfirmForm save={save} category={resource === 'categories'} description={resource === 'savings-pots' ? 'Deleting this pot hides its linked transactions. You can undo for 10 seconds.' : resource === 'recurring-payments' ? 'Pending future payments will stop. Paid history will be preserved.' : resource === 'transactions' ? 'This correction can change a linked pot balance or payment status.' : 'Historical transactions will be preserved.'} />
}
export function PaymentForm({ record, onDone }: { record: RecurringPayment; onDone: () => void }) {
  const { t } = useI18n(), save = useSave(() => payRecurring(record.id, record.month), onDone)
  return <SaveForm save={save} submitLabel="Confirm payment"><p className="text-preset-4">{t('This payment will be recorded for the selected month.')}</p><p>{record.month}: <Money value={record.amount} /></p></SaveForm>
}
