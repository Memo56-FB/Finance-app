import Image from 'next/image'
import React from 'react'
import { SingupForm } from '../ui/SingupForm'

const page = () => {

  return (
    <main className='grid grid-rows-[auto_1fr] h-full lg:flex '>
      <div className='bg-grey-900 rounded-b-lg px-500 py-300 grid place-items-center lg:hidden'>
        <Image alt='logo' src='/fullLogo.svg' width={122} height={22} />
      </div>
      <aside className="hidden p-250 lg:flex lg:flex-grow lg:max-w-[600px]">
        <div className="lg:flex lg:flex-col lg:justify-between lg:p-500 lg:bg-[url('/login-singup.png')] lg:bg-cover lg:bg-no-repeat lg:h-full lg:w-full lg:max-w-[560px] rounded-xl">
          <Image alt='logo' src='/fullLogo.svg' width={122} height={22} />
          <div className='grid gap-300 text-white'>
            <h2 className='text-preset-1 text-balance'>
              Keep track of your money and save for your future
            </h2>
            <p className='text-preset-4'>
              Personal finance app puts you in control of your spending. Track transactions, set budgets, and add to savings pots easily.
            </p>
          </div>
        </div>
      </aside>
      <section className='px-200 md:px-500 py-300 md:py-400 grid place-items-center lg:flex-grow'>
        <SingupForm />
      </section>
    </main>
  )
}

export default page