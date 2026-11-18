'use client'

import { ControlledLabel, Text, useI18n } from '@/lib/i18n/client'
import type { MoneyValue } from '@/lib/finance/money'

type SummaryGroup = { amount: MoneyValue; count: string | number }
export type RecurringBillsSummaryView = { total: SummaryGroup; paid: SummaryGroup; upcoming: SummaryGroup; dueSoon: SummaryGroup }

type RecurringBillsSummaryProps = {
  summary: RecurringBillsSummaryView
}

export const RecurringBillsSummary = ({ summary }: RecurringBillsSummaryProps) => {
  const { money } = useI18n()
  const summaryItems = [
    {
      label: 'Paid Bills',
      value: `${summary.paid.count} (${money(summary.paid.amount)})`,
      isDanger: false,
    },
    {
      label: 'Total Upcoming',
      value: `${summary.upcoming.count} (${money(summary.upcoming.amount)})`,
      isDanger: false,
    },
    {
      label: 'Due Soon',
      value: `${summary.dueSoon.count} (${money(summary.dueSoon.amount)})`,
      isDanger: true,
    },
  ]

  return (
    <article className='bg-white rounded-xl px-250 py-250 grid gap-250'>
      <h2 className='text-preset-3 text-grey-900'><Text id="Summary" /></h2>
      <div className='grid'>
        {summaryItems.map((item) => (
          <div
            className='flex flex-wrap gap-100 items-center justify-between border-b border-grey-100 py-200 first:pt-0 last:border-b-0 last:pb-0'
            key={item.label}
          >
            <p className={item.isDanger ? 'text-preset-5 text-red' : 'text-preset-5 text-grey-500'}>
              <ControlledLabel value={item.label} />
            </p>
            <p className={item.isDanger ? 'text-preset-5-bold text-red break-all' : 'text-preset-5-bold text-grey-900 break-all'}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </article>
  )
}
