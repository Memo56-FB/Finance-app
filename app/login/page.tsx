import { publicAccess } from '@/lib/auth/server'
import type { PageProps } from '@/lib/auth/types'
import { Text } from '@/lib/i18n/client'
import { PreferencesBar } from '@/lib/i18n/PreferencesBar'

import { BrandLogo } from '@/components/ui/BrandLogo'
import React from 'react'
import { LoginForm } from '../ui/LoginForm'

const page = async ({ searchParams }: PageProps) => {
  const params = await searchParams
  const access = await publicAccess(params)

  return (
    <>
    <header className="bg-card border-b-4 border-line px-500 py-300 grid shrink-0 place-items-center lg:hidden">
      <BrandLogo />
    </header>
    <div className="lg:absolute lg:right-0 lg:top-0 lg:z-10"><PreferencesBar authPage /></div>
    <main className="grid flex-1 lg:flex">
      <aside className="hidden p-250 lg:flex lg:flex-grow lg:max-w-[600px]">
        <div className="pixelated lg:flex lg:flex-col lg:justify-between lg:p-500 lg:bg-[url('/brand/login-scene.png')] lg:bg-cover lg:bg-center lg:bg-no-repeat lg:h-full lg:w-full lg:max-w-[560px] px-frame">
          <BrandLogo />
          <div className='grid gap-300 text-foreground bg-background/85 p-300 px-frame'>
            <h2 className='text-preset-1 text-balance'><Text id="Keep track of your money and save for your future" /></h2>
            <p className='text-preset-4'><Text id="Personal finance app puts you in control of your spending. Track transactions, set budgets, and add to savings pots easily." /></p>
          </div>
        </div>
      </aside>
      <section className='px-200 md:px-500 py-300 md:py-400 grid place-items-center lg:flex-grow'>
        <LoginForm next={typeof params.next === "string" ? params.next : undefined} unavailable={access.kind === "unavailable"} />
      </section>
    </main>
    </>
  )
}

export default page
