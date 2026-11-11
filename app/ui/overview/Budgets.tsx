"use client"

import { ControlledLabel, Money, Text } from '@/lib/i18n/client'
import * as React from "react"

import { Button } from "@/components/ui/button"
import { BudgetChart } from "@/app/ui/BudgetChart"
import Link from 'next/link'
import { budgets } from '../budgets/data'

const BudgetChartCard = ({ color, title, value }: {
  color: string
  title: string
  value: React.ReactNode
}) => {
  return (
    <article className='relative flex gap-200'>
      <div aria-hidden className={`h-full w-1 bg-${color} rounded-lg`} />
      <div className='grid gap-50'>
        <h3 className='text-preset-5 text-grey-500'><ControlledLabel value={title} /></h3>
        <p className='text-preset-4-bold text-grey-900'>{value}</p>
      </div>
    </article>
  )
}

export function Budgets() {
  return (
    <article className="flex flex-col p-400 bg-white rounded-xl">
      <div className="flex justify-between">
        <h2 className="text-preset-2 text-grey-900"><Text id="Budgets" /></h2>
        <Button variant={'tertiary'} asChild><Link href="/finance/budgets"><Text id="See Details" /></Link></Button>
      </div>
      <div className="flex flex-col md:flex-row">
        <div className="flex-1 pb-0">
          <BudgetChart />
        </div>
        <section className="grid grid-cols-2 gap-200 md:grid-cols-1 md:pt-250">
          {budgets.map((budget) => (
            <BudgetChartCard key={budget.title} color={budget.color} title={budget.title} value={<Money value={budget.ofValue} />} />
          ))}
        </section>
      </div>
    </article>
  )
}
