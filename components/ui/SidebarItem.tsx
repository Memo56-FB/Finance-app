'use client'

import Link from '@/app/ui/finance/FinanceLink'
import clsx from "clsx"
import { SidebarItemProps } from "@/types/SidebarItem"
import { useSidebarStore } from "@/store/sidebarStore"

const SidebarItem = ({ href, icon: Icon, active, title }: SidebarItemProps) => {
  const isOpen = useSidebarStore( state => state.isOpen)
  return (
    <Link
      href={href}
      aria-label={title}
      aria-current={active ? 'page' : undefined}
      className={clsx(
        "text-preset-5-bold lg:text-preset-3 motion-safe:transition-colors motion-safe:[transition-timing-function:steps(3)] items-center relative",
        "flex min-w-[44px] min-h-[44px] flex-col gap-50 pt-100 pb-150 px-100 justify-center lg:flex-row lg:py-200 lg:px-400",
        {
          'text-ink px-gradient before:content-[""] before:h-1 before:w-full before:bottom-0 lg:before:w-1 lg:before:h-full before:bg-highlight before:absolute lg:before:left-0': active
        },
        {
          'text-ink-muted hover:text-ink hover:bg-line': !active
        },
        {
          'lg:gap-200': isOpen
        },
        {
          'lg:gap-0': !isOpen
        }
      )}
    >
      <Icon weight="fill" size={24} className={clsx(
        {
          'text-theme-1': active
        }
      )}/>
      <p className={clsx(
        "hidden md:flex text-nowrap",
        {
          'lg:w-0 lg:overflow-hidden transition-all': !isOpen
        },
        )}>
        {title}
      </p>
    </Link>
  )
}

export default SidebarItem
