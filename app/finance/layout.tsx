import { Sidebar } from '@/components/ui/Sidebar'
import { useSidebarStore } from '@/store/sidebarStore';
import React from 'react'

const layout = ({children}: Readonly<{
  children: React.ReactNode;
}>) => {

  return (
    <div className='flex'>
      <div className='flex-none'>
        <Sidebar />
      </div>
      <main className='flex-grow'>
        {children}
      </main>
    </div>
  )
}

export default layout