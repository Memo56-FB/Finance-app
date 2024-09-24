import { Separator } from '@/components/ui/separator'
import Image from 'next/image'
import React from 'react'

export const TransactionTableDesktop = () => {
  return (
    <table className='hidden md:grid gap-300'>
      <thead className='text-grey-500 py-150 border-b border-b-grey-100'>
        <tr className='grid grid-cols-6 gap-400 text-left *:font-normal *:text-preset-5'>
          <th className='col-span-3'>Recipient / Sender</th>
          <th>Category</th>
          <th>Transaction Date</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody className='[&>:not(:last-child)]:border-b [&>:not(:last-child)]:pb-200 [&>:not(:first-child)]:pt-200 text-preset-5'>
        <tr className='grid grid-cols-6 gap-400 text-grey-500 border-b-grey-100'>
          <td className='flex items-center gap-200 col-span-3'>
            <Image
              className='rounded-full'
              src='/profilePictures/Logo-1.jpg'
              alt='recipient'
              width={40}
              height={40}
            />
            <p className='text-preset-4-bold grey-900'>Bravo Zen Spa</p>
          </td>
          <td>Personal Care</td>
          <td>29 Aug 2024</td>
          <td className='text-grey-900 text-preset-4-bold'>-$25.00</td>
        </tr>
        <tr className='grid grid-cols-6 gap-400 text-grey-500 border-b-grey-100'>
          <td className='flex items-center gap-200 col-span-3'>
            <Image
              className='rounded-full'
              src='/profilePictures/Logo-1.jpg'
              alt='recipient'
              width={40}
              height={40}
            />
            <p className='text-preset-4-bold grey-900'>Bravo Zen Spa</p>
          </td>
          <td>Personal Care</td>
          <td>29 Aug 2024</td>
          <td className='text-grey-900 text-preset-4-bold'>-$25.00</td>
        </tr>
        <tr className='grid grid-cols-6 gap-400 text-grey-500 border-b-grey-100'>
          <td className='flex items-center gap-200 col-span-3'>
            <Image
              className='rounded-full'
              src='/profilePictures/Logo-1.jpg'
              alt='recipient'
              width={40}
              height={40}
            />
            <p className='text-preset-4-bold grey-900'>Bravo Zen Spa</p>
          </td>
          <td>Personal Care</td>
          <td>29 Aug 2024</td>
          <td className='text-grey-900 text-preset-4-bold'>-$25.00</td>
        </tr>
        <tr className='grid grid-cols-6 gap-400 text-grey-500 border-b-grey-100'>
          <td className='flex items-center gap-200 col-span-3'>
            <Image
              className='rounded-full'
              src='/profilePictures/Logo-1.jpg'
              alt='recipient'
              width={40}
              height={40}
            />
            <p className='text-preset-4-bold grey-900'>Bravo Zen Spa</p>
          </td>
          <td>Personal Care</td>
          <td>29 Aug 2024</td>
          <td className='text-grey-900 text-preset-4-bold'>-$25.00</td>
        </tr>
      </tbody>
    </table>
  )
}
