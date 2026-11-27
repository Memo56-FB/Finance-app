'use client'
import { cn } from '@/lib/utils'
import React from 'react'
import { safeColor } from '@/lib/finance/colors'

interface ProgressProps extends React.ProgressHTMLAttributes<HTMLProgressElement> {
  max: number
  value: number
  color: string

}

export const Progress = ({ max, value, color, className, ...props }: ProgressProps) => {
  return (
    <>
      <progress
        className={cn(`h-400 w-full progress [&::-webkit-progress-bar]:bg-background [&::-webkit-progress-value]:bg-[var(--progress-color)] [&::-moz-progress-bar]:bg-[var(--progress-color)]
          [&::-webkit-progress-bar]:rounded-none [&::-webkit-progress-bar]:p-50
          [&::-webkit-progress-value]:rounded-none`, className)
        }
        max={max}
        value={value}
        {...props}
        style={{ ...props.style, '--progress-color':safeColor(color) } as React.CSSProperties}>
        {value}%
      </progress>
    </>
  )
}
