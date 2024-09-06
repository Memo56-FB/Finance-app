import { ArrowFatLinesLeft } from '@phosphor-icons/react'
import React from 'react'

const MinimizeMenu = ({onClick}: {onClick: () => void}) => {
  return (
    <button
      onClick={onClick}
      className='flex items-center gap-200 text-preset-3 text-grey-300 hover:text-white transition-colors bg-grey-900 px-400 py-200'
    >
      <ArrowFatLinesLeft weight='fill' size={24} />
      Minimize Menu
    </button>
  )
}

export default MinimizeMenu