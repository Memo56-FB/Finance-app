import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/Progress"
import { Separator } from "@/components/ui/separator"
import { latestSpending } from "@/types/budgets"
import { DotsThreeOutline } from "@phosphor-icons/react/dist/ssr"
import Image from "next/image"
import { EditDeleteDropdown } from "./EditDeleteDropdown"

const LatestCard = (latest: latestSpending) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-200">
        <Image
          src={latest.image}
          alt="profile picture"
          width={32}
          height={32}
          className="rounded-full hidden md:block"
        />
        <p className="text-preset-5-bold text-grey-900">{latest.name}</p>
      </div>
      <div className="flex flex-col gap-50">
        <p className="text-preset-5-bold text-grey-900">{latest.value}</p>
        <p className="text-preset-5 text-grey-500">{latest.date}</p>
      </div>
    </div>
  )
}

export const BudgetsCard = ({ title, color, ofValue, spent, free, latest }: {
  title: string
  ofValue: number
  color: string
  spent: number
  free: number | string
  latest: latestSpending
}) => {
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
        <p className="text-preset-4 text-grey-500">Maximum of ${ofValue}</p>
        <Progress value={spent} max={ofValue} color={color} />
        <div className="grid grid-cols-2">
          {/* Spent */}
          <div className="flex gap-200">
            <span className={`h-full bg-${color} rounded-lg w-1`} />
            <div className="flex flex-col gap-50">
              <p className="text-preset-5 text-grey-500">Spent</p>
              <p className="text-preset-4-bold text-grey-900">${spent.toFixed(2)}</p>
            </div>
          </div>
          {/* Free */}
          <div className="flex gap-200">
            <span className={`h-full bg-beige-100 rounded-lg w-1`} />
            <div className="flex flex-col gap-50">
              <p className="text-preset-5 text-grey-500">Free</p>
              <p className="text-preset-4-bold text-grey-900">{free}</p>
            </div>
          </div>
        </div>
      </div>
      {/* Latest Spending*/}
      <section className="bg-beige-100 rounded-xl p-200 grid gap-250">
        <header className="flex justify-between">
          <h3 className="text-preset-3 text-grey-900">Latest Spending</h3>
          <Button variant={'tertiary'}>
            See All
          </Button>
        </header>
        <div className="grid gap-150">
          <LatestCard {...latest} />
          <Separator className='bg-grey-500/15' />
          <LatestCard {...latest} />
          <Separator className='bg-grey-500/15' />
          <LatestCard {...latest} />
        </div>
      </section>
    </article>
  )
}
