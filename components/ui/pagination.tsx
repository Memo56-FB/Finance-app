import * as React from "react"
import { MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { CaretLeft, CaretRight } from "@phosphor-icons/react"
import Link from "next/link"

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
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
  href: string
}

const PaginationLink = ({
  className,
  isActive,
  href,
  ...props
}: PaginationLinkProps) => (
  <Link
    href={href}
    aria-current={isActive ? "page" : undefined}
    className={cn(
      'px-200 flex items-center h-10 py-100 bg-white text-grey-900 rounded-lg transition-colors',
      isActive ? 'text-white bg-grey-900' : 'hover:text-white hover:bg-beige-500',
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    className={cn("px-200 py-100 gap-200 flex bg-white border border-beige-500 text-preset-4 rounded-lg items-center h-10 hover:bg-beige-500 group transition-colors", className)}
    {...props}
  >
    <CaretLeft className="h-4 w-4 text-grey-500 group-hover:text-white transition-colors" weight="fill" />
    <span className="text-grey-900 group-hover:text-white transition-colors">Prev</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    className={cn("px-200 py-100 gap-200 flex bg-white border border-beige-500 text-preset-4 rounded-lg items-center h-10 hover:bg-beige-500 group transition-colors", className)}
    {...props}
  >
    <span className="text-grey-900 group-hover:text-white transition-colors">Next</span>
    <CaretRight className="h-4 w-4 text-grey-500 group-hover:text-white transition-colors" weight="fill" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
