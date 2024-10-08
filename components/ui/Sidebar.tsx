'use client'

import React from 'react'
import SidebarItem from './SidebarItem'
import MinimizeMenu from './MinimizeMenu'
import Image from 'next/image'
import { ArrowsDownUp, ChartDonut, House, Receipt, TipJar } from '@phosphor-icons/react'
import { useSidebarStore } from '@/store/sidebarStore'
import clsx from 'clsx'
import { usePathname } from 'next/navigation'

export const Sidebar = () => {
  const isOpen = useSidebarStore( state => state.isOpen)
  const toggle = useSidebarStore( state => state.toggle)
  const pathname = usePathname()
  return (
    <nav
      className={clsx('bg-grey-900 rounded-t-xl px-200 pt-100 flex justify-center md:px-500 lg:grid lg:grid-rows-[auto_1fr_auto] lg:items-start lg:rounded-r-xl lg:rounded-l-none transition-all lg:pl-0 lg:min-h-screen lg:pb-300 lg:gap-300',
        {
          'lg:w-[98px] lg:justify-normal lg:pr-100': !isOpen,
          'lg:w-[300px] lg:justify-normal': isOpen
        }
      )}
    >
      <div className='hidden lg:block lg:px-400 lg:py-500 justify-self-start'>
        
          <Image
            className={clsx(
              {
                'hidden': !isOpen
              }
            )}
            src='/fullLogo.svg'
            alt='finance'
            width={121}
            height={22}
          />
          <Image
            className={clsx(
              {
                'hidden': isOpen
              }
            )}
            src='/logo.svg'
            alt='finance'
            width={14}
            height={25}
          />
      </div>
      <div className='flex w-full justify-between lg:flex-col lg:gap-50 lg:items-start '>
        <SidebarItem active={pathname === '/finance'} href='/finance' icon={House} title='Overview' />
        <SidebarItem active={pathname === '/finance/transactions'} href='/finance/transactions' icon={ArrowsDownUp} title='Transactions' />
        <SidebarItem active={pathname === '/finance/budgets'} href='/finance/budgets' icon={ChartDonut} title='Budgets' />
        <SidebarItem active={pathname === '/finance/pots'} href='/finance/pots' icon={TipJar} title='Pots' />
        <SidebarItem active={pathname === '/finance/recurring-bills'} href='/finance/recurring-bills' icon={Receipt} title='Recurring bills' />
      </div>
      <MinimizeMenu onClick={toggle} />
    </nav>
  )
}
