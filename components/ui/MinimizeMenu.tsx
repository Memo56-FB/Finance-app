'use client'

import { useSidebarStore } from '@/store/sidebarStore'
import { ArrowFatLinesLeft } from '@phosphor-icons/react'
import clsx from 'clsx'
import React from 'react'

const MinimizeMenu = ({onClick}: {onClick: () => void}) => {
  const isOpen = useSidebarStore( state => state.isOpen)
  return (
    <button
      onClick={onClick}
      className='items-center gap-200 text-preset-3 text-grey-300 hover:text-white transition-colors px-400 py-200 self-end hidden lg:flex lg:text-nowrap ease-in-out'
    >
      <ArrowFatLinesLeft weight='fill' size={24} className={clsx(
        'transition-transform',
        {
          'transform rotate-180': !isOpen
        }
      )} />
      {
        isOpen &&
          'Minimize Menu'
      }
    </button>
  )
}

export default MinimizeMenu