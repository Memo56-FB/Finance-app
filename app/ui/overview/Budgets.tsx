"use client"

import { ControlledLabel, Money, Text } from '@/lib/i18n/client'
import * as React from "react"

import { Button } from "@/components/ui/button"
import { BudgetChart } from "@/app/ui/BudgetChart"
import Link from '@/app/ui/finance/FinanceLink'
import { budgets } from '../budgets/data'
import type { BudgetView } from '@/lib/finance/optimistic'
import { safeColor } from '@/lib/finance/colors'

const BudgetChartCard = ({ color, title, value }: {
  color: string
  title: React.ReactNode
  value: React.ReactNode
}) => {
  return (
    <article className='relative flex gap-200'>
      <div aria-hidden className="h-full w-1 shrink-0 rounded-lg" style={{backgroundColor:safeColor(color)}} />
      <div className='grid gap-50'>
        <h3 className='text-preset-5 text-grey-500 break-words'>{title}</h3>
        <p className='text-preset-4-bold text-grey-900 break-all'>{value}</p>
      </div>
    </article>
  )
}

export function Budgets({items}:{items?:BudgetView[]}) {
  const rows=items ? items.map(item=>({id:item.id,title:item.categoryName,color:item.color,ofValue:item.spendingLimit})) : budgets.map(item=>({...item,id:item.title}))
  return (
    <article className="flex flex-col p-400 bg-white rounded-xl min-w-0">
      <div className="flex flex-wrap justify-between gap-100">
        <h2 className="text-preset-2 text-grey-900"><Text id="Budgets" /></h2>
        <Button variant={'tertiary'} asChild><Link href="/finance/budgets"><Text id="See Details" /></Link></Button>
      </div>
      {items?.length === 0 ? <p className="text-preset-4 text-grey-500 mt-200"><Text id="No budgets yet."/></p> : <div className="flex flex-col md:flex-row">
        <div className="flex-1 pb-0">
          <BudgetChart items={items}/>
        </div>
        <section className="grid grid-cols-2 auto-rows-min content-start gap-200 md:grid-cols-1 md:pt-250">
          {rows.slice(0, 4).map((budget) => (
            <BudgetChartCard key={budget.id} color={budget.color} title={items ? budget.title : <ControlledLabel value={budget.title}/>} value={<Money value={budget.ofValue} />} />
          ))}
        </section>
      </div>}
    </article>
  )
}
