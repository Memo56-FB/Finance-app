'use client'

import { useI18n } from '@/lib/i18n/client'
import React from 'react'
import SidebarItem from './SidebarItem'
import MinimizeMenu from './MinimizeMenu'
import { BrandLogo } from './BrandLogo'
import { ArrowsDownUp, ChartDonut, House, Receipt, TipJar, Tag } from '@phosphor-icons/react'
import { useSidebarStore } from '@/store/sidebarStore'
import clsx from 'clsx'
import { usePathname } from 'next/navigation'

export const Sidebar = () => {
  const { t, language } = useI18n()
  const isOpen = useSidebarStore( state => state.isOpen)
  const toggle = useSidebarStore( state => state.toggle)
  const pathname = usePathname()
  return (
    <nav
      className={clsx('bg-panel border-t-4 border-line px-200 pt-100 flex justify-center md:px-100 lg:grid lg:grid-rows-[auto_1fr_auto] lg:items-start lg:border-t-0 lg:border-r-4 motion-safe:transition-all motion-safe:[transition-timing-function:steps(6)] lg:pl-0 lg:h-full lg:pb-300 lg:gap-300',
        {
          'lg:w-[98px] lg:justify-normal lg:pr-100': !isOpen,
          'lg:w-[300px] lg:justify-normal': isOpen
        }
      )}
    >
      <div className='hidden lg:block lg:px-400 lg:py-500 justify-self-start'>
        
          <BrandLogo
            className={clsx(
              {
                'hidden': !isOpen
              }
            )}
          />
          <BrandLogo
            variant='mark'
            className={clsx(
              {
                'hidden': isOpen
              }
            )}
          />
      </div>
      <div className='flex w-full justify-between lg:flex-col lg:gap-50 lg:items-start '>
        <SidebarItem active={pathname === '/finance'} href='/finance' icon={House} title={t("Overview")} />
        <SidebarItem active={pathname === '/finance/transactions'} href='/finance/transactions' icon={ArrowsDownUp} title={t("Transactions")} />
        <SidebarItem active={pathname === '/finance/categories'} href='/finance/categories' icon={Tag} title={t('Categories')} />
        <SidebarItem active={pathname === '/finance/budgets'} href='/finance/budgets' icon={ChartDonut} title={t("Budgets")} />
        <SidebarItem active={pathname === '/finance/pots'} href='/finance/pots' icon={TipJar} title={t("Pots")} />
        <SidebarItem active={pathname === '/finance/recurring-bills'} href='/finance/recurring-bills' icon={Receipt} title={(language === "en" ? "Recurring bills" : t("Recurring Bills"))} />
      </div>
      <MinimizeMenu onClick={toggle} />
    </nav>
  )
}
