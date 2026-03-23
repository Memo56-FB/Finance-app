import React from 'react'
import { cn } from '@/lib/utils'

interface ProgressDiffProps extends React.HTMLAttributes<HTMLSpanElement> {
  max: number
  currentValue: number
  incomingValue: number
  color: string
}

export const ProgressDiff = ({
  max,
  currentValue,
  incomingValue,
  color,
  className,
  ...props
}: ProgressDiffProps) => {
  const segmentGap = '0.125rem'
  const safeMax = Math.max(max, 0)
  const baseValue = Math.min(Math.max(currentValue, 0), safeMax)
  const nextValue = Math.min(Math.max(baseValue + incomingValue, baseValue), safeMax)
  const basePercentage = safeMax > 0 ? (baseValue / safeMax) * 100 : 0
  const diffPercentage = safeMax > 0 ? ((nextValue - baseValue) / safeMax) * 100 : 0
  const hasBaseSegment = basePercentage > 0
  const hasDiffSegment = diffPercentage > 0
  const gapOffset = hasBaseSegment && hasDiffSegment ? `(${segmentGap} / 2)` : '0rem'

  return (
    <span
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={nextValue}
      {...props}
      className={cn('relative w-full h-2 block bg-beige-100 rounded-lg overflow-hidden', className)}
    >
      <span
        aria-hidden="true"
        className='absolute inset-y-0 left-0 block rounded-lg rounded-r-none bg-grey-900 transition-[width]'
        style={{
          width: `max(0px, calc(${basePercentage}% - ${gapOffset}))`,
        }}
      />
      <span
        aria-hidden="true"
        className={cn('absolute inset-y-0 block rounded-lg transition-[left,width] rounded-l-none', `bg-${color}`)}
        style={{
          left: `calc(${basePercentage}% + ${gapOffset})`,
          width: `max(0px, calc(${diffPercentage}% - ${gapOffset}))`,
        }}
      />
    </span>
  )
}
