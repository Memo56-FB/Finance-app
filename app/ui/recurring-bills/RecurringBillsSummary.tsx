import { currencyFormatter, type RecurringBillsSummary as RecurringBillsSummaryData } from './list/utils'

type RecurringBillsSummaryProps = {
  summary: RecurringBillsSummaryData
}

export const RecurringBillsSummary = ({ summary }: RecurringBillsSummaryProps) => {
  const summaryItems = [
    {
      label: 'Paid Bills',
      value: `${summary.paid.count} (${currencyFormatter.format(summary.paid.amount)})`,
      isDanger: false,
    },
    {
      label: 'Total Upcoming',
      value: `${summary.upcoming.count} (${currencyFormatter.format(summary.upcoming.amount)})`,
      isDanger: false,
    },
    {
      label: 'Due Soon',
      value: `${summary.dueSoon.count} (${currencyFormatter.format(summary.dueSoon.amount)})`,
      isDanger: true,
    },
  ]

  return (
    <article className='bg-white rounded-xl px-250 py-250 grid gap-250'>
      <h2 className='text-preset-3 text-grey-900'>Summary</h2>
      <div className='grid'>
        {summaryItems.map((item) => (
          <div
            className='flex items-center justify-between border-b border-grey-100 py-200 first:pt-0 last:border-b-0 last:pb-0'
            key={item.label}
          >
            <p className={item.isDanger ? 'text-preset-5 text-red' : 'text-preset-5 text-grey-500'}>
              {item.label}
            </p>
            <p className={item.isDanger ? 'text-preset-5-bold text-red' : 'text-preset-5-bold text-grey-900'}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </article>
  )
}
