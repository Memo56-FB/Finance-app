"use client"

import { Text, useI18n } from '@/lib/i18n/client'
import { Label, Pie, PieChart } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { budgets } from './budgets/data'
import type { BudgetView } from '@/lib/finance/optimistic'
import { Skeleton } from '@/components/ui/skeleton'
import { cents, decimal, moneyRatio } from '@/lib/finance/money'

const innerRadius = 60
// Leave room where the circular opening narrows below its center.
const labelWidth = innerRadius * 2 - 16

function fitLabel(label: SVGTextElement | null) {
  if (!label) return

  const fit = () => {
    const width = label.getBBox().width
    label.setAttribute('transform', `scale(${width > labelWidth ? labelWidth / width : 1})`)
  }
  fit()
  const observer = new ResizeObserver(fit)
  observer.observe(label)
  return () => observer.disconnect()
}

export const BudgetChart = ({items}: {items?:BudgetView[]}) => {
  const { money, messages, t } = useI18n()
  const rows=items ? items.map(item=>({title:item.categoryName,spent:item.spent,ofValue:item.spendingLimit,fill:item.color})) : budgets
  const totalBudget=decimal(rows.reduce((sum,row)=>sum+cents(row.ofValue),0n))
  if (rows.some(row => row.spent === null)) return (
    <div className="grid min-h-[240px] place-items-center gap-2 py-4 text-center">
      <Skeleton className="size-36" />
      <p className="text-preset-5 text-ink-muted"><Text id="of" />{' '}{money(totalBudget)}{' '}<Text id="limit" /></p>
    </div>
  )
  const totalSpent=decimal(rows.reduce((sum,row)=>sum+cents(row.spent!),0n))
  const chart=rows.map(row=>({...row,title:items ? row.title : messages[row.title as keyof typeof messages] ?? row.title,chartValue:moneyRatio(row.spent!,totalSpent),exactSpent:String(row.spent)}))
  const hasSpending = chart.some(row => row.chartValue > 0)
  const data = hasSpending ? chart : [{ chartValue: 1, fill: 'hsl(var(--line))' }]
  const spentLabel = money(totalSpent)
  const limitLabel = `${t('of')} ${money(totalBudget)} ${t('limit')}`
  return (
    <ChartContainer
      config={{ chartValue: { label: t('Spent') } }}
      className="mx-auto aspect-square w-full max-w-[250px]"
    >
      <PieChart>
        {hasSpending && <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel formatter={(_value, name, entry) => (
            <div className="flex w-full items-center justify-between gap-2">
              <span className="text-muted-foreground">{name}</span>
              <span className="font-medium tabular-nums">{money(entry.payload.exactSpent)}</span>
            </div>
          )} />}
        />}
        <Pie
          data={data}
          dataKey="chartValue"
          nameKey="title"
          innerRadius={innerRadius}
          isAnimationActive={true}
        >
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <g transform={`translate(${viewBox.cx}, ${viewBox.cy})`} textAnchor="middle" dominantBaseline="middle">
                    <text ref={fitLabel} className="fill-foreground text-preset-1 text-ink">
                      {spentLabel}
                    </text>
                    <g transform="translate(0, 24)">
                      <text ref={fitLabel} className="fill-muted-foreground text-preset-5 text-ink-muted">
                        {limitLabel}
                      </text>
                    </g>
                  </g>
                )
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
