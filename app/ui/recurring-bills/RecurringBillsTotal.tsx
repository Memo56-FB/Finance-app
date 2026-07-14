import { Receipt } from '@phosphor-icons/react/dist/ssr'

export const RecurringBillsTotal = () => {
  return (
    <article className='bg-grey-900 rounded-xl px-250 py-300 grid gap-400 text-white'>
      <Receipt size={32} className='text-white' />
      <div className='grid gap-100'>
        <p className='text-preset-4'>Total Bills</p>
        <p className='text-preset-1'>$384.98</p>
      </div>
    </article>
  )
}
