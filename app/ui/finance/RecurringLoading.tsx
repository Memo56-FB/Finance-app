import { Skeleton } from '@/components/ui/skeleton'

export const recurringLayout = 'grid gap-300 xl:grid-cols-[337px_minmax(0,1fr)]'
export const recurringListPanel = 'grid min-w-0 gap-300 px-inset bg-card px-250 py-300 md:px-400 xl:col-start-2 xl:row-start-1'
export const recurringTableColumns = 'md:grid-cols-[minmax(0,1fr)_160px_120px_44px]'

export function RecurringSummarySkeleton() {
  return <div className="grid gap-150 md:grid-cols-2 xl:grid-cols-1">
    <div className="grid gap-400 px-inset bg-panel px-250 py-300">
      <Skeleton className="size-8 bg-ink/20"/>
      <div className="grid gap-100">
        <Skeleton className="h-[21px] w-24 bg-ink/20"/>
        <Skeleton className="h-[38px] w-28 bg-ink/20"/>
      </div>
    </div>
    <div className="grid gap-250 px-inset bg-card p-250">
      <Skeleton className="h-6 w-24"/>
      <div>
        {Array.from({length: 3}, (_, index) => (
          <div key={index} className="flex justify-between gap-100 border-b border-line py-200 first:pt-0 last:border-b-0 last:pb-0">
            <Skeleton className="h-[18px] w-24"/>
            <Skeleton className="h-[18px] w-16"/>
          </div>
        ))}
      </div>
    </div>
  </div>
}

export function RecurringRowsSkeleton() {
  return <div className="grid gap-300">
    <div className={`hidden items-center gap-200 border-b border-line pb-150 md:grid ${recurringTableColumns}`}>
      <Skeleton className="h-[18px] w-24 max-w-full"/>
      <Skeleton className="h-[18px] w-20"/>
      <Skeleton className="h-[18px] w-14 justify-self-end"/>
    </div>
    <div>
      {Array.from({length: 4}, (_, index) => (
        <div key={index} className={`relative grid grid-cols-[minmax(0,1fr)_auto_44px] items-center gap-x-200 border-b border-line py-200 first:pt-0 last:border-b-0 last:pb-0 ${recurringTableColumns}`}>
          <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-200 pl-12 md:pl-0">
            <Skeleton className="absolute left-0 top-1/2 size-8 shrink-0 -translate-y-1/2 rounded-none md:static md:translate-y-0"/>
            <Skeleton className="h-[21px] w-full max-w-36"/>
          </div>
          <div className="col-start-1 row-start-2 flex min-w-0 items-center gap-100 pl-12 md:col-start-2 md:row-start-1 md:pl-0">
            <Skeleton className="h-[18px] w-20"/>
            <Skeleton className="size-3 shrink-0 rounded-none"/>
          </div>
          <Skeleton className="col-start-2 row-span-2 row-start-1 h-[21px] w-14 justify-self-end md:col-start-3 md:row-span-1"/>
          <Skeleton className="col-start-3 row-span-2 row-start-1 size-5 justify-self-center md:col-start-4 md:row-span-1"/>
        </div>
      ))}
    </div>
    <div className="flex flex-wrap items-center justify-center gap-1">
      <Skeleton className="h-11 w-11 lg:h-10"/>
      <Skeleton className="h-11 w-11 lg:h-10"/>
      <Skeleton className="h-4 w-10 lg:h-10 lg:w-11"/>
      <Skeleton className="h-11 w-11 lg:h-10"/>
      <Skeleton className="h-11 w-11 lg:h-10"/>
    </div>
  </div>
}

export function RecurringPageSkeleton() {
  return <div className="grid gap-400">
    <div className="grid gap-50">
      <Skeleton className="h-[18px] w-12"/>
      <Skeleton className="h-[45px] w-40"/>
    </div>
    <div className={recurringLayout}>
      <RecurringSummarySkeleton/>
      <div className={recurringListPanel}>
        <div className="flex items-center justify-between gap-300">
          <Skeleton className="h-[45px] w-full min-w-0 max-w-80"/>
          <Skeleton className="h-[45px] w-11 shrink-0 md:w-28"/>
        </div>
        <RecurringRowsSkeleton/>
      </div>
    </div>
  </div>
}
