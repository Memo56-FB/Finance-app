import { Sidebar } from '@/components/ui/Sidebar'
import { PreferencesBar } from '@/lib/i18n/PreferencesBar'
import React from 'react'

const layout = ({children}: Readonly<{
  children: React.ReactNode;
}>) => {

  return (
    <div className='grid grid-rows-[1fr_auto] lg:flex h-full w-full'>
      <div className='lg:flex-none row-start-2'>
        <Sidebar />
      </div>
      <div className='min-h-0 min-w-0 overflow-auto lg:flex-1'>
        <PreferencesBar />
        <main className='flex flex-col gap-400 py-300 md:py-400 px-200 md:px-500'>
          {children}
        </main>
      </div>
    </div>
  )
}

export default layout
