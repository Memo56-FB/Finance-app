'use client'

import React, { FC } from 'react'
import { Input } from './input'
import { cn } from '@/lib/utils'
import { MagnifyingGlass } from '@phosphor-icons/react'

interface InputPasswordProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const InputSearch:FC<InputPasswordProps> = ({className, type, ...props}) => {

  return (
    <div className='relative w-full max-w-80'>
      <Input
        className={cn(className, 'w-full pl-250 py-150 pr-[52px] text-ellipsis')}
        type={type ?? 'text'}
        {...props}
      />
      <MagnifyingGlass className='absolute right-250 top-150 text-grey-900'  />
    </div>
  )
}
