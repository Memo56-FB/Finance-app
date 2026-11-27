'use client'

import { useI18n } from '@/lib/i18n/client'
import type { Messages } from '@/lib/i18n'
import * as React from "react"

import { cn } from "@/lib/utils"
import { CaretDoubleLeft, CaretDoubleRight, CaretLeft, CaretRight } from "@phosphor-icons/react"
import Link from "next/link"

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => { const { t } = useI18n(); return (
  <nav
    role="navigation"
    aria-label={t("pagination")}
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
) }
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

interface PaginationLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement>{
  className?: string
  isActive?: boolean
  disabled?: boolean
  href: string
  prefetch?: React.ComponentProps<typeof Link>['prefetch']
  onNavigate?: React.ComponentProps<typeof Link>['onNavigate']
}

const PaginationLink = ({
  className,
  isActive,
  disabled,
  href,
  onClick,
  ...props
}: PaginationLinkProps) => (
  <Link
    href={href}
    aria-current={isActive ? "page" : undefined}
    aria-disabled={disabled || undefined}
    tabIndex={disabled ? -1 : props.tabIndex}
    className={cn(
      'flex min-h-10 min-w-11 items-center justify-center px-200 py-100 motion-safe:transition-colors',
      isActive ? 'bg-theme-3 text-ink px-bevel' : 'bg-card text-ink px-inset hover:bg-line',
      disabled && 'pointer-events-none cursor-not-allowed opacity-50',
      className
    )}
    {...props}
    onClick={event => {
      if (disabled) event.preventDefault()
      else onClick?.(event)
    }}
  />
)
PaginationLink.displayName = "PaginationLink"

function pageWindow(page: number, total: number) {
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1)
  const start = Math.max(2, Math.min(page - 1, total - 3))
  return [1, start, start + 1, start + 2, total]
}

function PaginationArrow({ icon: Icon, label, className, ...props }: PaginationLinkProps & {
  icon: typeof CaretLeft
  label: keyof Messages
}) {
  const { t } = useI18n()
  return <PaginationLink {...props} aria-label={t(label)} className={cn('group max-lg:min-h-11', className)}>
    <Icon aria-hidden="true" size={16} weight="fill" className="text-ink-muted motion-safe:transition-colors group-hover:text-ink" />
  </PaginationLink>
}

function PaginationPrevious(props: PaginationLinkProps) {
  return <PaginationArrow {...props} icon={CaretLeft} label="Go to previous page" />
}

function PaginationNext(props: PaginationLinkProps) {
  return <PaginationArrow {...props} icon={CaretRight} label="Go to next page" />
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
  return <span {...props} aria-hidden="true" className={cn('px-1 text-preset-5 text-ink-muted', className)}>…</span>
}

function PaginationControls({ page, total, link, className }: {
  page: number
  total: number
  link: (page: number) => PaginationLinkProps
  className?: string
}) {
  const { t } = useI18n()
  const pages = pageWindow(page, total)
  return <Pagination className={className}>
    <PaginationContent className="flex-wrap justify-center gap-0.5 sm:gap-1">
      <PaginationItem>
        <PaginationArrow {...link(1)} icon={CaretDoubleLeft} label="Go to first page" disabled={page === 1} />
      </PaginationItem>
      <PaginationItem>
        <PaginationPrevious {...link(Math.max(1, page - 1))} disabled={page === 1} />
      </PaginationItem>
      <PaginationItem className="px-1 text-center text-preset-5 lg:hidden">
        <span role="status">{t('{page} of {total}').replace('{page}', String(page)).replace('{total}', String(total))}</span>
      </PaginationItem>
      {pages.map((number, index) => <React.Fragment key={number}>
        {index > 0 && number - pages[index - 1] > 1 && <PaginationItem className="hidden lg:list-item">
          <PaginationEllipsis />
        </PaginationItem>}
        <PaginationItem className="hidden lg:list-item">
          <PaginationLink {...link(number)} isActive={number === page}>{number}</PaginationLink>
        </PaginationItem>
      </React.Fragment>)}
      <PaginationItem>
        <PaginationNext {...link(Math.min(total, page + 1))} disabled={page === total} />
      </PaginationItem>
      <PaginationItem>
        <PaginationArrow {...link(total)} icon={CaretDoubleRight} label="Go to last page" disabled={page === total} />
      </PaginationItem>
    </PaginationContent>
  </Pagination>
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationControls,
  PaginationNext,
  PaginationPrevious,
}
