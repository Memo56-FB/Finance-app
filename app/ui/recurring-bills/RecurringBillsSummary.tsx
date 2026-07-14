const summaryItems = [
  {
    label: 'Paid Bills',
    value: '4 ($190.00)',
    isDanger: false,
  },
  {
    label: 'Total Upcoming',
    value: '4 ($194.98)',
    isDanger: false,
  },
  {
    label: 'Due Soon',
    value: '2 ($59.98)',
    isDanger: true,
  },
]

export const RecurringBillsSummary = () => {
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
