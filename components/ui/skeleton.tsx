import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }: ComponentProps<'span'>) {
  return <span {...props} data-slot="skeleton" aria-hidden="true"
    className={cn('block rounded-md bg-beige-100 motion-safe:animate-pulse', className)} />
}
