import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/lib/i18n/client'

export function LoadingRegion({ children }: { children: ReactNode }) {
  return <>
    <span role="status" className="sr-only"><Text id="Loading…" /></span>
    <div aria-busy="true">{children}</div>
  </>
}

export function FieldSkeleton() {
  return <div className="grid gap-50"><Skeleton className="h-3 w-20" /><Skeleton className="h-[45px] w-full" /></div>
}

export function RowsSkeleton({ count = 4 }: { count?: number }) {
  return <div className="grid gap-200">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="grid min-h-12 grid-cols-[minmax(0,1fr)_auto_2.75rem] items-center gap-200 border-b border-grey-100">
        <Skeleton className="h-4 w-3/4 max-w-52" />
        <Skeleton className="h-4 w-14 md:w-24" />
        <Skeleton className="size-6 justify-self-center" />
      </div>
    ))}
  </div>
}

export function CardsSkeleton({ count = 2, chart = false, showActions = false }: {
  count?: number
  chart?: boolean
  showActions?: boolean
}) {
  return <div className={`grid items-start gap-300 ${showActions ? 'xl:grid-cols-2' : 'lg:grid-cols-2'}`}>
    {chart && <div className="grid gap-200 rounded-xl bg-white p-300">
      <Skeleton className="mx-auto size-40 rounded-full" />
      <RowsSkeleton count={2} />
    </div>}
    <div className={chart ? 'grid gap-300' : 'contents'}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="grid gap-300 rounded-xl bg-white p-300">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-2 w-full" />
          <div className="grid grid-cols-2 gap-150"><Skeleton className="h-10"/><Skeleton className="h-10"/></div>
          {showActions && <div className="grid grid-cols-2 gap-200">
            <Skeleton className="h-[53px] rounded-lg"/>
            <Skeleton className="h-[53px] rounded-lg"/>
          </div>}
        </div>
      ))}
    </div>
  </div>
}

export function AmountsSkeleton() {
  return <div className="grid gap-150 md:grid-cols-3 md:gap-300">
    {Array.from({ length: 3 }, (_, index) => (
      <div key={index} className="grid gap-200 rounded-xl bg-white p-300">
        <Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-32" />
      </div>
    ))}
  </div>
}
