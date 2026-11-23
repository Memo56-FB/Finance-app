'use client'
import { CalendarField } from './CalendarField'

import { useState } from 'react'
import { validId } from '@/lib/api/finance-json'
import { calendarDate } from '@/lib/finance/contracts'
import { validAmount } from '@/lib/finance/money'
import { payRecurring, saveRecord } from '@/lib/finance/services'
import type { RecurringPayment } from '@/lib/finance/types'
import { Money, useI18n } from '@/lib/i18n/client'
import { FormInput, FormSelect, SaveForm, useSave } from './common'
import { AmountHelp, CategoryField, nameValid, useFieldError, validate } from './form-fields'

export function RecurringForm({ record }: { record?: RecurringPayment }) {
  const { t, recurringFrequency } = useI18n()
  const [name, setName] = useState(record?.name ?? '')
  const [categoryId, setCategory] = useState(record?.categoryId ?? '')
  const [amount, setAmount] = useState(record?.amount ?? '')
  const [type, setType] = useState<string>(record?.type ?? 'SUBSCRIPTION')
  const [date, setDate] = useState(record?.firstDueDate ?? '')
  const [count, setCount] = useState(String(record?.totalInstallments ?? ''))
  const [interval, setInterval] = useState(String(record?.intervalMonths ?? 1))
  const installment = type === 'INSTALLMENT'
  const save = useSave(async () => {
    validate({
      name: nameValid(name),
      categoryId: validId(categoryId),
      amount: validAmount(amount),
      firstDueDate: calendarDate(date),
      totalInstallments: !installment || /^[1-9]\d*$/.test(count) && BigInt(count) <= 2147483647n,
      intervalMonths: installment || /^(?:[1-9]|1[0-2])$/.test(interval),
    })
    return saveRecord('recurring-payments', {
      name: name.trim(), categoryId, amount, type,
      firstDueDate: date,
      intervalMonths: installment ? 1 : interval,
      ...(installment ? { totalInstallments: count } : {}),
    }, record?.id)
  })
  const error = useFieldError(save.error)
  return <SaveForm save={save}>
    <FormInput label="Name" value={name} onChange={e => setName(e.target.value)} maxLength={100} error={error('name')} required/>
    <CategoryField value={categoryId} onChange={setCategory} error={error('categoryId')}/>
    <FormSelect label="Payment type" value={type} onChange={setType} options={[
      { value: 'SUBSCRIPTION', label: t('Subscription') },
      { value: 'INSTALLMENT', label: t('Installments') },
    ]}/>
    {!installment && <FormSelect label="Frequency" value={interval} onChange={setInterval}
      options={Array.from({length: 12}, (_, index) => ({ value: String(index + 1), label: recurringFrequency(index + 1) }))}
      error={error('intervalMonths')}/>}
    <FormInput label="Per payment" money inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} error={error('amount')} required/>
    <AmountHelp/>
    <CalendarField label="First due date" value={date} onChange={setDate} error={error('firstDueDate')}/>
    {installment && <FormInput label="Number of installments" inputMode="numeric" value={count} onChange={e => setCount(e.target.value)} error={error('totalInstallments')} required/>}
  </SaveForm>
}

export function PaymentForm({ record }: { record: RecurringPayment }) {
  const { t } = useI18n(), save = useSave(() => payRecurring(record.id, record.month))
  return <SaveForm save={save} submitLabel="Confirm payment"><p className="text-preset-4">{t('This payment will be recorded for the selected month.')}</p><p>{record.month}: <Money value={record.amount} /></p></SaveForm>
}
