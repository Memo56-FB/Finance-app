'use client'
import { useI18n } from '@/lib/i18n/client'
import { cn } from '@/lib/utils'
import { Check } from '@phosphor-icons/react'
import type { RecurringBill } from './types'

type BillDueDateProps = {
  bill: RecurringBill
  className?: string
}

export const BillDueDate = ({ bill, className }: BillDueDateProps) => {
  const { t } = useI18n()
  const isDue = bill.status === 'due'

  return (
    <p className={cn('flex items-center gap-100 text-preset-5 text-green', isDue && 'text-red', className)}>
      {t('Monthly')} {bill.dueDay}
      <span
        aria-label={t(isDue ? 'Due soon' : 'Paid')}
        className={cn(
          'grid h-3 w-3 place-items-center rounded-none bg-green text-[8px] leading-none text-ink',
          isDue && 'bg-red'
        )}
      >
        {isDue ? '!' : <Check size={8} weight='bold' />}
      </span>
    </p>
  )
}
