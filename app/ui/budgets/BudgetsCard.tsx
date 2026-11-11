import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/Progress"
import { Separator } from "@/components/ui/separator"
import { EditDeleteDropdown } from "./EditDeleteDropdown"
import { Fragment } from 'react'
import Link from 'next/link'
import { TransactionsCardTable } from '../transactions/TransactionsCardTable'
import { currencyFormatter } from '@/lib/utils'
import type { Budget } from './data'

export const BudgetsCard = ({ title, color, ofValue, spent, latest }: Budget) => {
  return (
    <article className="bg-white rounded-xl grid gap-250 px-250 py-300 md:p-400 lg:col-start-2">
      <header className="flex justify-between items-center">
        <div className="flex gap-200 items-center">
          <span className={`bg-${color} rounded-full h-4 w-4`} />
          <h2 className="text-preset-2 text-grey-900">{title}</h2>
        </div>
        <EditDeleteDropdown />
      </header>
      <div className="grid gap-200">
        <p className="text-preset-4 text-grey-500">Maximum of {currencyFormatter.format(ofValue)}</p>
        <Progress aria-label={`${title} spending`} value={spent} max={ofValue} color={color} />
        <div className="grid grid-cols-2">
          {/* Spent */}
          <div className="flex gap-200">
            <span className={`h-full bg-${color} rounded-lg w-1`} />
            <div className="flex flex-col gap-50">
              <p className="text-preset-5 text-grey-500">Spent</p>
              <p className="text-preset-4-bold text-grey-900">{currencyFormatter.format(spent)}</p>
            </div>
          </div>
          {/* Free */}
          <div className="flex gap-200">
            <span className={`h-full bg-beige-100 rounded-lg w-1`} />
            <div className="flex flex-col gap-50">
              <p className="text-preset-5 text-grey-500">Free</p>
              <p className="text-preset-4-bold text-grey-900">{currencyFormatter.format(ofValue - spent)}</p>
            </div>
          </div>
        </div>
      </div>
      {/* Latest Spending*/}
      <section className="bg-beige-100 rounded-xl p-200 grid gap-250">
        <header className="flex justify-between">
          <h3 className="text-preset-3 text-grey-900">Latest Spending</h3>
          <Button variant={'tertiary'} asChild>
            <Link href={`/finance/transactions?${new URLSearchParams({ category: title })}`}>See All</Link>
          </Button>
        </header>
        <div className="grid gap-150">
          {latest.map((transaction, index) => (
            <Fragment key={transaction.id}>
              <TransactionsCardTable transaction={transaction} />
              {index < latest.length - 1 && <Separator className='bg-grey-500/15' />}
            </Fragment>
          ))}
        </div>
      </section>
    </article>
  )
}
