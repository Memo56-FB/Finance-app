import { Sidebar } from '@/components/ui/Sidebar'
import React from 'react'

const layout = ({children}: Readonly<{
  children: React.ReactNode;
}>) => {

  return (
    <div className='grid grid-rows-[1fr_auto] lg:flex h-full w-full'>
      <div className='lg:flex-none row-start-2'>
        <Sidebar />
      </div>
      <main className='flex flex-col gap-400 flex-grow overflow-auto py-300 md:py-400 px-200 md:px-500'>
        {children}
      </main>
    </div>
  )
}

export default layout