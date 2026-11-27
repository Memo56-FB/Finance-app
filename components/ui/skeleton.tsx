import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }: ComponentProps<'span'>) {
  return <span {...props} data-slot="skeleton" aria-hidden="true"
    className={cn('block bg-line motion-safe:animate-pulse', className)} />
}
