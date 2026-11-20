"use client"

import { Text, useI18n } from '@/lib/i18n/client'
import { Label, Pie, PieChart, Tooltip } from "recharts"

import {
  ChartContainer,
} from "@/components/ui/chart"
import { budgets } from './budgets/data'
import type { Budget } from '@/lib/finance/types'
import { cents, decimal, moneyRatio } from '@/lib/finance/money'

export const BudgetChart = ({items}: {items?:Budget[]}) => {
  const { money, messages } = useI18n()
  const rows=items ? items.map(item=>({title:item.categoryName,spent:item.spent,ofValue:item.spendingLimit,fill:item.color})) : budgets
  const totalSpent=decimal(rows.reduce((sum,row)=>sum+cents(row.spent),0n))
  const totalBudget=decimal(rows.reduce((sum,row)=>sum+cents(row.ofValue),0n))
  const chart=rows.map(row=>({...row,title:items ? row.title : messages[row.title as keyof typeof messages] ?? row.title,chartValue:moneyRatio(row.spent,totalSpent),exactSpent:String(row.spent)}))
  return (
    <ChartContainer
      config={{}}
      className="mx-auto aspect-square max-h-[240px] md:h-[300px]"
    >
      <PieChart>
        <Pie
          data={chart}
          dataKey="chartValue"
          nameKey="title"
          innerRadius={70}
          outerRadius={105}
        />
        <Pie data={[{ value: 100 }]} dataKey="value" tooltipType="none" fill="#FFF" opacity={0.25} outerRadius={80} innerRadius={70}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className={money(totalSpent).length > 14 ? 'fill-foreground text-preset-4-bold text-grey-900' : 'fill-foreground text-preset-1 text-grey-900'}
                    >
                      {money(totalSpent)}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 24}
                      className="fill-muted-foreground text-preset-5 text-grey-500"
                    >{' '}<Text id="of" />{' '}{money(totalBudget)}{' '}<Text id="limit" />{' '}</tspan>
                  </text>
                )
              }
            }}
          />
        </Pie>
        <Tooltip formatter={(_value,_name,entry)=>money(entry.payload.exactSpent)} />
      </PieChart>
    </ChartContainer>
  )
}
