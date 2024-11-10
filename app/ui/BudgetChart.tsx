"use client"
import { Label, Pie, PieChart } from "recharts"

import {
  ChartContainer,
} from "@/components/ui/chart"

const mobileData = [
  { budget: "Entertainment", mobile: 50, fill: "#277C78" },
  { budget: "Bills", mobile: 750, fill: "#82C9D7" },
  { budget: "Dining Out", mobile: 75, fill: "#F2CDAC" },
  { budget: "Personal Care", mobile: 100, fill: "#626070" },
]

export const BudgetChart = () => {
  return (
    <ChartContainer
      config={{}}
      className="mx-auto aspect-square max-h-[240px] md:h-[300px]"
    >
      <PieChart>
        <Pie
          data={mobileData}
          dataKey="mobile"
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
  )
}
