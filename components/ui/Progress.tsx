'use client'
import { cn } from '@/lib/utils'
import React from 'react'

interface ProgressProps extends React.ProgressHTMLAttributes<HTMLProgressElement> {
  max: number
  value: number
  color: string

}

export const Progress = ({ max, value, color, className, ...props }: ProgressProps) => {
  return (
    <>
      <progress
        className={cn(`h-400 w-full progress [&::-webkit-progress-bar]:bg-beige-100 [&::-webkit-progress-value]:bg-${color}
          [&::-webkit-progress-bar]:rounded [&::-webkit-progress-bar]:p-50
          [&::-webkit-progress-value]:rounded`, className)
        }
        max={max}
        value={value}
        {...props}>
        {value}%
      </progress>
    </>
  )
}
