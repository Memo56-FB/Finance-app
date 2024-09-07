import { Sidebar } from '@/components/ui/Sidebar'
import { useSidebarStore } from '@/store/sidebarStore';
import React from 'react'

const layout = ({children}: Readonly<{
  children: React.ReactNode;
}>) => {

  return (
    <div className='grid grid-rows-[1fr_auto] lg:flex h-full'>
      <div className='lg:flex-none row-start-2'>
        <Sidebar />
      </div>
      <main className='flex-grow'>
        {children}
      </main>
    </div>
  )
}

export default layout