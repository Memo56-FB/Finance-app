'use client'

import { useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { RecurringPageSkeleton } from './RecurringLoading'
import { AmountsSkeleton, CardsSkeleton, LoadingRegion, RowsSkeleton } from './Loading'
import { PageHeader, type Label } from './common'
import { financeRoutes } from '@/lib/auth/types'
import { Overview as LiveOverview } from '@/app/ui/finance/Overview'
import { Text } from '@/lib/i18n/client'
import { Budgets } from '@/app/ui/overview/Budgets'
import { Pots } from '@/app/ui/overview/Pots'
import { RecurringBills } from '@/app/ui/overview/RecurringBills'
import { Summary } from '@/app/ui/overview/Summary'
import { Transactions } from '@/app/ui/overview/Transactions'
import { Transactions as LiveTransactions } from '@/app/ui/finance/Transactions'
import TransactionsPage from '@/app/ui/transactions/TransactionsPage'
import { Categories, GuestCategories } from '@/app/ui/finance/Categories'
import { Budgets as LiveBudgets } from '@/app/ui/finance/Budgets'
import { SpendingSummary } from '@/app/ui/budgets/SpendingSummary'
import { BudgetsCard } from '@/app/ui/budgets/BudgetsCard'
import { CreateBudget } from '@/app/ui/budgets/CreateBudget'
import { budgets } from '@/app/ui/budgets/data'
import { Pots as LivePots } from '@/app/ui/finance/Pots'
import { CreatePot } from '@/app/ui/pots/CreatePot'
import { PotCard } from '@/app/ui/pots/PotCard'
import { Recurring as LiveRecurring } from '@/app/ui/finance/Recurring'
import { RecurringBillsLayout } from '@/app/ui/recurring-bills/RecurringBillsLayout'

function GuestOverview() {
  return (
    <>
      <h1 tabIndex={-1} className='text-preset-1 text-grey-900'><Text id="Overview" /></h1>
      <Summary />
      <section className='grid grid-cols-1 gap-200 xl:gap-0 xl:grid-cols-[auto_auto] xl:gap-x-300'>
        <div className='flex flex-col gap-200 xl:gap-200'>
          <Pots />
          <Transactions />
        </div>
        <div className='flex flex-col gap-200 xl:gap-200'>
          <Budgets />
          <RecurringBills />
        </div>
      </section>
    </>
  )
}
function GuestBudgets() {
  return (
    <>
      <header className='flex flex-wrap items-center justify-between gap-200'>
        <h1 tabIndex={-1} className='text-preset-1 text-grey-900'><Text id="Budgets" /></h1>
        <CreateBudget />
      </header>
      <section className='grid grid-cols-1 items-start gap-300 lg:grid-cols-2'>
        <SpendingSummary />
        <div className='grid min-w-0 gap-300'>
          {budgets.map((budget) => <BudgetsCard key={budget.title} {...budget} />)}
        </div>
      </section>
    </>
  )
}
function GuestPots() {
  return (
    <>
      <header className='flex flex-wrap items-center justify-between gap-200'>
        <h1 tabIndex={-1} className='text-preset-1 text-grey-900'><Text id="Pots" /></h1>
        <CreatePot />
      </header>
      <section className='grid gap-300 xl:grid-cols-2'>
        <PotCard color='green' title='Savings' totalSaved={159.00} targetOf={2000} />
        <PotCard color='navy' title='Concert Ticket' totalSaved={110.00} targetOf={150} />
        <PotCard color='cyan' title='Gift' totalSaved={40.00} targetOf={60} />
        <PotCard color='yellow' title='New Laptop' totalSaved={10.00} targetOf={1000} />
        <PotCard color='purple' title='Holiday' totalSaved={531.00} targetOf={1440} />
      </section>
    </>
  )
}
function GuestRecurring() {
  return (
    <>
      <h1 tabIndex={-1} className='text-preset-1 text-grey-900'><Text id="Recurring Bills" /></h1>
      <RecurringBillsLayout />
    </>
  )
}

const accountViews = [LiveOverview, LiveTransactions, Categories, LiveBudgets, LivePots, LiveRecurring]
const titles: Label[] = ['Overview', 'Transactions', 'Categories', 'Budgets', 'Pots', 'Recurring Bills']
const subscribe = () => () => {}
const guestViews = [GuestOverview, TransactionsPage, GuestCategories, GuestBudgets, GuestPots, GuestRecurring]

function SectionSkeleton({ index }: { index: number }) {
  if (index === 0) return <div className="grid gap-300"><AmountsSkeleton/><CardsSkeleton chart/><RowsSkeleton/></div>
  if (index === 3) return <CardsSkeleton chart/>
  if (index === 4) return <CardsSkeleton showActions/>
  if (index === 5) return <RecurringPageSkeleton/>
  return <RowsSkeleton/>
}

export function FinanceView({ guest }: { guest: boolean }) {
  const pathname = usePathname()
  // Streaming queries can resolve at different times in the HTML and RSC renders.
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false)
  const previous = useRef(pathname)
  const root = useRef<HTMLDivElement>(null)
  const index = financeRoutes.indexOf(pathname)

  useLayoutEffect(() => {
    if (previous.current === pathname) return
    previous.current = pathname
    root.current?.closest('[data-finance-scroll]')?.scrollTo(0, 0)
    root.current?.querySelector('h1')?.focus({ preventScroll: true })
    if (!guest) window.dispatchEvent(new Event('finance-navigation'))
  }, [guest, pathname])

  const View = (guest ? guestViews : accountViews)[index]
  return <div className="contents" ref={root}>
    {View && (guest || hydrated ? <View key={pathname} /> : <>
      <PageHeader title={titles[index]}>{index === 5 && <Skeleton className="h-[53px] w-44"/>}</PageHeader>
      <LoadingRegion><SectionSkeleton index={index}/></LoadingRegion>
    </>)}
  </div>
}
