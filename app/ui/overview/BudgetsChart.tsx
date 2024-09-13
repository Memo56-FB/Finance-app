"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Button } from "@/components/ui/button"

export const description = "A pie chart with stacked sections"

const mobileData = [
  { budget: "Entertainment", mobile: 50, fill: "#277C78" },
  { budget: "Bills", mobile: 750, fill: "#82C9D7" },
  { budget: "Dining Out", mobile: 75, fill: "#F2CDAC" },
  { budget: "Personal Care", mobile: 100, fill: "#626070" },
]

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  desktop: {
    label: "Desktop",
  },
  mobile: {
    label: "Mobile",
  },
  january: {
    label: "January",
    color: "hsl(var(--chart-1))",
  },
  february: {
    label: "February",
    color: "hsl(var(--chart-2))",
  },
  march: {
    label: "March",
    color: "hsl(var(--chart-3))",
  },
  april: {
    label: "April",
    color: "hsl(var(--chart-4))",
  },
  may: {
    label: "May",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

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

export function BudgetsChart() {
  return (
    <article className="flex flex-col p-400 bg-white rounded-xl">
      <div className="flex justify-between">
        <h2 className="text-preset-2 text-grey-900">Budgets</h2>
        <Button variant={'tertiary'}>See Details</Button>
      </div>
      <div className="flex flex-col md:flex-row">
        <div className="flex-1 pb-0">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[240px]"
          >
            <PieChart>
              <Pie
                data={mobileData}
                dataKey="mobile"
                innerRadius={70}
                outerRadius={100}
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
                            $338
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground text-preset-5 text-grey-500"
                          >
                            of $975 limit
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
              <Pie data={[{ value: 100 }]} dataKey="value" fill="#FFF" opacity={0.25} outerRadius={80} innerRadius={70} />
            </PieChart>
          </ChartContainer>
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
