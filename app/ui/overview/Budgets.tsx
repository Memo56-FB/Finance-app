"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { BudgetChart } from "@/app/ui/BudgetChart"



const BudgetChartCard = ({ color, title, value }: {
  color: string
  title: string
  value: number | string
}) => {
  return (
    <article className='relative flex gap-200'>
      <div aria-hidden className={`h-full w-1 bg-${color} rounded-lg`} />
      <div className='grid gap-50'>
        <h3 className='text-preset-5 text-grey-500'>{title}</h3>
        <p className='text-preset-4-bold text-grey-900'>{value}</p>
      </div>
    </article>
  )
}

export function Budgets() {
  return (
    <article className="flex flex-col p-400 bg-white rounded-xl">
      <div className="flex justify-between">
        <h2 className="text-preset-2 text-grey-900">Budgets</h2>
        <Button variant={'tertiary'}>See Details</Button>
      </div>
      <div className="flex flex-col md:flex-row">
        <div className="flex-1 pb-0">
          <BudgetChart />
        </div>
        <section className="grid grid-cols-2 gap-200 md:grid-cols-1 md:pt-250">
          <BudgetChartCard color="green" title="Entertainment" value="$50.00" />
          <BudgetChartCard color="cyan" title="Bills" value="$750.00" />
          <BudgetChartCard color="yellow" title="Dining Out" value="$75.00" />
          <BudgetChartCard color="navy" title="Personal Care" value="$100.00" />
        </section>
      </div>
    </article>
  )
}
