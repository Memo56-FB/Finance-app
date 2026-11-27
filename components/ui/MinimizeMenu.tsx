'use client'

import { useI18n } from '@/lib/i18n/client'
import { useSidebarStore } from '@/store/sidebarStore'
import { ArrowFatLinesLeft } from '@phosphor-icons/react'
import clsx from 'clsx'
import React from 'react'

const MinimizeMenu = ({onClick}: {onClick: () => void}) => {
  const { t } = useI18n()
  const isOpen = useSidebarStore( state => state.isOpen)
  return (
    <button
      type="button"
      aria-label={isOpen ? t('Minimize Menu') : t('Expand Menu')}
      aria-expanded={isOpen}
      onClick={onClick}
      className='items-center gap-200 text-preset-3 text-ink-muted hover:text-ink hover:bg-line motion-safe:transition-colors motion-safe:[transition-timing-function:steps(3)] px-400 py-200 self-end hidden lg:flex lg:text-nowrap'
    >
      <ArrowFatLinesLeft weight='fill' size={24} className={clsx(
        'motion-safe:transition-transform motion-safe:[transition-timing-function:steps(4)]',
        {
          'transform rotate-180': !isOpen
        }
      )} />
      {
        isOpen &&
          t('Minimize Menu')
      }
    </button>
  )
}

export default MinimizeMenu
