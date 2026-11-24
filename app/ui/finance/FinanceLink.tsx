'use client'

import type { ComponentProps } from 'react'
import { financeRoutes } from '@/lib/auth/types'

export default function FinanceLink({ href, onClick, ...props }: ComponentProps<'a'>) {
  return <a {...props} href={href} onClick={event => {
    onClick?.(event)
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
        event.shiftKey || event.altKey || props.download != null ||
        (props.target && props.target !== '_self')) return
    const target = new URL(event.currentTarget.href)
    if (target.origin !== location.origin ||
        !financeRoutes.includes(location.pathname) || !financeRoutes.includes(target.pathname)) return
    event.preventDefault()
    if (target.href !== location.href) history.pushState(null, '', target.href)
  }} />
}
