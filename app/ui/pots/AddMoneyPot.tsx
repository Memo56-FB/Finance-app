'use client'

import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ProgressDiff } from '@/components/ui/ProgressDiff'

type AddMoneyPotProps = {
  title: string
  totalSaved: number
  targetOf: number
  color: string
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export const AddMoneyPot = ({
  title,
  totalSaved,
  targetOf,
  color,
}: AddMoneyPotProps) => {
  const amountInputId = useId()
  const [amountToAdd, setAmountToAdd] = useState('0')
  const parsedAmount = Number(amountToAdd)
  const incomingValue = Number.isFinite(parsedAmount) ? Math.max(parsedAmount, 0) : 0
  const newAmount = totalSaved + incomingValue
  const safeTarget = Math.max(targetOf, 0)
  const progressPercentage = safeTarget > 0 ? (Math.min(newAmount, safeTarget) / safeTarget) * 100 : 0

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">
          +Add Money
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-40px)] max-w-[560px] px-250 py-250 rounded-xl md:px-400 md:py-400 grid gap-250">
        <DialogHeader className="grid justify-start gap-250">
          <DialogTitle className="text-start text-preset-2 text-grey-900">Add New Pot</DialogTitle>
          <DialogDescription className="text-start text-preset-4 text-grey-500">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus hendrerit. Pellentesque aliquet nibh nec urna. In nisi neque, aliquet.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => event.preventDefault()} className="grid gap-250">
          <section className="grid gap-150" aria-label={`${title} savings preview`}>
            <div className="flex items-center justify-between gap-200">
              <p className="text-preset-5 text-grey-500">New Amount</p>
              <p className="text-preset-1 text-grey-900">{currencyFormatter.format(newAmount)}</p>
            </div>
            <div className="grid grid-cols-2 gap-150">
              <ProgressDiff
                max={targetOf}
                currentValue={totalSaved}
                incomingValue={incomingValue}
                color={color}
                className="col-span-2"
              />
              <p className="text-preset-5-bold text-green">{progressPercentage.toFixed(2)}%</p>
              <p className="text-right text-preset-5 text-grey-500">
                Target of {currencyFormatter.format(targetOf)}
              </p>
            </div>
          </section>

          <div className="grid gap-50">
            <label htmlFor={amountInputId} className="text-preset-5-bold text-grey-500">
              Amount to Add
            </label>
            <div className="relative">
              <p className="absolute left-250 top-[10px] text-preset-4 text-beige-500">
                $
              </p>
              <Input
                id={amountInputId}
                inputMode="decimal"
                min={0}
                type="number"
                value={amountToAdd}
                onChange={(event) => setAmountToAdd(event.target.value)}
                className="pl-500"
              />
            </div>
          </div>

          <Button className="text-preset-4-bold text-white">
            Confirm Addition
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
