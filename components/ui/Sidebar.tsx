'use client'

import React from 'react'
import SidebarItem from './SidebarItem'
import MinimizeMenu from './MinimizeMenu'
import Image from 'next/image'
import { ArrowsDownUp, ChartDonut, House, Receipt, TipJar } from '@phosphor-icons/react'
import { useSidebarStore } from '@/store/sidebarStore'
import clsx from 'clsx'

export const Sidebar = () => {
  const isOpen = useSidebarStore( state => state.isOpen)
  const toggle = useSidebarStore( state => state.toggle)
  return (
    <nav
      className={clsx('bg-grey-900 rounded-t-xl px-200 pt-100 flex justify-center md:px-500 md:justify-between lg:grid lg:grid-rows-[auto_1fr_auto] lg:items-start lg:rounded-r-xl lg:rounded-l-none transition-all lg:pl-0 lg:min-h-screen lg:pb-300 lg:gap-300',
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
      <div className='flex lg:flex-col lg:gap-50 lg:items-start'>
        <SidebarItem active={true} href='/' icon={House} title='Overview' />
        <SidebarItem active={false} href='/transactions' icon={ArrowsDownUp} title='Transactions' />
        <SidebarItem active={false} href='/budgets' icon={ChartDonut} title='Budgets' />
        <SidebarItem active={false} href='/pots' icon={TipJar} title='Pots' />
        <SidebarItem active={false} href='/recurring-bills' icon={Receipt} title='Recurring bills' />
      </div>
      <MinimizeMenu onClick={toggle} />
    </nav>
  )
}
