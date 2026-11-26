'use client'

import { ApiError } from '@/lib/api/client'
import { colorHex } from '@/lib/finance/colors'
import { cents, decimal, moneyRatio, validAmount } from '@/lib/finance/money'
import { movePot, saveRecord } from '@/lib/finance/services'
import type { Pot } from '@/lib/finance/types'
import { Money, Percentage, useI18n } from '@/lib/i18n/client'
import { ProgressDiff } from '@/components/ui/ProgressDiff'
import { FormInput, SaveForm, useDraftField, useSave } from './common'
import { AmountHelp, ColorField, nameValid, useFieldError, validate } from './form-fields'

export function PotForm({ record }: { record?: Pot }) {
  const [name, setName] = useDraftField('name', record?.name ?? '')
  const [target, setTarget] = useDraftField('targetAmount', record?.targetAmount ?? '')
  const [color, setColor] = useDraftField('color', record?.color ?? colorHex.green)
  const save = useSave(() => {
    validate({ name: nameValid(name), targetAmount: validAmount(target), color: /^#[\da-f]{6}$/i.test(color) })
    return signal => saveRecord('savings-pots', { name: name.trim(), targetAmount: target, color }, record?.id, signal)
  }, {
    resource: 'savings-pots', id: record?.id, label: record ? 'Edit' : 'Add Pot',
    name: name.trim(), draft: { name, targetAmount: target, color }, editor: <PotForm record={record} />,
    intent: { resource: 'savings-pots', action: 'save', before: record,
      value: { id: record?.id ?? '', name: name.trim(), color, targetAmount: target, balance: record?.balance ?? '0.00' } },
  })
  const error = useFieldError(save.error)
  const { t } = useI18n()
  return <SaveForm save={save} submitLabel={record ? 'Save Changes' : 'Add Pot'}>
    <p className="text-preset-4 text-grey-500">{t(record ? 'Preview changes to your savings target.' : 'Create a pot to set savings targets.')}</p>
    <div className="grid gap-50">
      <FormInput label="Pot Name" value={name} placeholder={t('e.g. Rainy Days')} onChange={e => setName(e.target.value)} maxLength={100} error={error('name')} required/>
      <span className="text-right text-preset-5 text-grey-500">{100 - name.length} {t('Characters left')}</span>
    </div>
    <FormInput label="Target" money inputMode="decimal" placeholder={t('e.g. 2000')} value={target} onChange={e => setTarget(e.target.value)} error={error('targetAmount')} required/>
    <AmountHelp/>
    <ColorField value={color} onChange={setColor}/>
  </SaveForm>
}

export function PotMoneyForm({ record, action }: { record: Pot; action: 'deposits' | 'withdrawals' }) {
  const [amount, setAmount] = useDraftField('amount', '0')
  const { t, money } = useI18n()
  const change = validAmount(amount) ? cents(amount) * (action === 'withdrawals' ? -1n : 1n) : 0n
  const nextAmount = decimal(cents(record.balance) + change)
  const currentProgress = moneyRatio(record.balance, record.targetAmount)
  const nextProgress = moneyRatio(nextAmount, record.targetAmount)
  const save = useSave(() => {
    validate({ amount: validAmount(amount) })
    if (action === 'withdrawals' && cents(amount) > cents(record.balance)) throw new ApiError(400, ['amount'])
    return signal => movePot(record.id, action, amount, signal)
  }, {
    resource: 'savings-pots', id: record.id, label: action === 'deposits' ? 'Confirm Addition' : 'Confirm Withdrawal',
    intent: { resource: 'savings-pots', action: 'move', before: record, delta: change },
    name: record.name, draft: { amount }, editor: <PotMoneyForm record={record} action={action} />,
  })
  const error = useFieldError(save.error)
  return <SaveForm save={save} className="gap-250" submitLabel={action === 'deposits' ? 'Confirm Addition' : 'Confirm Withdrawal'}>
    <section className="grid gap-150" aria-label={`${record.name} ${t(action === 'deposits' ? 'savings preview' : 'withdrawal preview')}`}>
      <div className="flex flex-wrap items-center justify-between gap-200"><p className="text-preset-5 text-grey-500">{t('New Amount')}</p><p className="text-preset-1 text-grey-900 break-all"><Money value={nextAmount} /></p></div>
      <div className="grid grid-cols-2 gap-150"><ProgressDiff aria-label={`${record.name} ${t(action === 'deposits' ? 'savings preview' : 'withdrawal preview')}`} aria-valuetext={money(nextAmount)} max={100} currentValue={currentProgress} incomingValue={nextProgress - currentProgress} color={action === 'deposits' ? record.color : 'red'} className="col-span-2" /><p className={`text-preset-5-bold ${action === 'deposits' ? 'text-green' : 'text-red'}`}><Percentage value={nextProgress / 100} /></p><p className="text-right text-preset-5 text-grey-500 break-all">{t('Target of')} <Money value={record.targetAmount} /></p></div>
    </section>
    <FormInput label={action === 'deposits' ? 'Amount to Add' : 'Amount to Withdraw'} money inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} error={validAmount(amount) && action === 'withdrawals' && cents(amount) > cents(record.balance) ? t('Insufficient funds.') : error('amount')} required /><AmountHelp />
  </SaveForm>
}
