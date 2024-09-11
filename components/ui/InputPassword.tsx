'use client'

import React, { FC } from 'react'
import { Input } from './input'
import { Eye, EyeSlash } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface InputPasswordProps extends
Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

export const InputPassword:FC<InputPasswordProps> = ({className, ...props}) => {
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <div className='relative w-full'>
      <Input
        className={cn(className, 'w-full')}
        type={showPassword ? 'text' : 'password'}
        {...props}
      />
      <button
        aria-label='Toggle password visibility'
        type='button'
        className='absolute right-250 top-150'
        onClick={() => setShowPassword(prev => !prev)}
      >
        {showPassword
          ? <EyeSlash weight='fill' size={16}/>
          : <Eye weight='fill' size={16}/>
        }
        
      </button>
    </div>
  )
}
