"use client"

import { Text, useI18n } from '@/lib/i18n/client'
import { Label, Pie, PieChart } from "recharts"

import {
  ChartContainer,
} from "@/components/ui/chart"
import { budgets, totalBudget, totalSpent } from './budgets/data'

export const BudgetChart = () => {
  const { money } = useI18n()
  return (
    <ChartContainer
      config={{}}
      className="mx-auto aspect-square max-h-[240px] md:h-[300px]"
    >
      <PieChart>
        <Pie
          data={budgets}
          dataKey="spent"
          nameKey="title"
          innerRadius={70}
          outerRadius={105}
        >
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
                      className="fill-foreground text-preset-1 text-grey-900"
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
        <Pie data={[{ value: 100 }]} dataKey="value" fill="#FFF" opacity={0.25} outerRadius={80} innerRadius={70} />
      </PieChart>
    </ChartContainer>
  )
}
