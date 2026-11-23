import { getAccess } from '@/lib/auth/server'
import { SessionControls } from '@/lib/auth/SessionControls'
import type { Metadata } from 'next'
import { Sidebar } from '@/components/ui/Sidebar'
import { PreferencesBar } from '@/lib/i18n/PreferencesBar'
import React from 'react'
import { AccountScope } from '@/lib/finance/AccountScope'

export const metadata: Metadata = { robots: { index: false, follow: false } }

const layout = async ({children}: Readonly<{
  children: React.ReactNode;
}>) => {

  const access = await getAccess()
  if (access.kind !== 'guest' && access.kind !== 'account') return children
  return (
    <div className='grid grid-rows-[1fr_auto] lg:flex h-full w-full'>
      <div className='lg:flex-none row-start-2'>
        <Sidebar />
      </div>
      <div className='min-h-0 min-w-0 overflow-auto lg:flex-1'>
        <div className="flex items-start justify-between gap-200">
          <SessionControls access={access} />
          <PreferencesBar />
        </div>
        <main className='flex flex-col gap-400 py-300 md:py-400 px-200 md:px-500'>
          {access.kind === 'account' ? <AccountScope key={access.username} account={access.username}>{children}</AccountScope> : children}
        </main>
      </div>
    </div>
  )
}

export default layout
