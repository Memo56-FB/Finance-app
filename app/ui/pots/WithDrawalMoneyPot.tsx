'use client'

import { CurrencySymbol, Money, Percentage, Text, useI18n } from '@/lib/i18n/client'
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

type WithDrawalMoneyPotProps = {
  title: string
  totalSaved: number
  targetOf: number
}

export const WithDrawalMoneyPot = ({
  title,
  totalSaved,
  targetOf,
}: WithDrawalMoneyPotProps) => {
  const { t } = useI18n()
  const amountInputId = useId()
  const [amountToWithdraw, setAmountToWithdraw] = useState('0')
  const parsedAmount = Number(amountToWithdraw)
  const withdrawalValue = Number.isFinite(parsedAmount) ? Math.max(parsedAmount, 0) : 0
  const newAmount = Math.max(totalSaved - withdrawalValue, 0)
  const safeTarget = Math.max(targetOf, 0)
  const progressPercentage = safeTarget > 0 ? (Math.min(newAmount, safeTarget) / safeTarget) * 100 : 0

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary"><Text id="Withdraw" /></Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-40px)] max-w-[560px] px-250 py-250 px-inset md:px-400 md:py-400 grid gap-250">
        <DialogHeader className="grid justify-start gap-250">
          <DialogTitle className="text-start text-preset-2 text-ink">{' '}<Text id="Withdraw from" /> &apos;{title}&apos;
          </DialogTitle>
          <DialogDescription className="text-start text-preset-4 text-ink-muted"><Text id="Preview your savings after withdrawing money. Changes are not saved in this demo." /></DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => event.preventDefault()} className="grid gap-250">
          <section className="grid gap-150" aria-label={`${title} ${t('withdrawal preview')}`}>
            <div className="flex items-center justify-between gap-200">
              <p className="text-preset-5 text-ink-muted"><Text id="New Amount" /></p>
              <p className="text-preset-1 text-ink"><Money value={newAmount} /></p>
            </div>
            <div className="grid grid-cols-2 gap-150">
              <ProgressDiff
                aria-label={`${title} ${t('withdrawal preview')}`}
                max={targetOf}
                currentValue={totalSaved}
                incomingValue={-withdrawalValue}
                color="red"
                className="col-span-2"
              />
              <p className="text-preset-5-bold text-red"><Percentage value={progressPercentage / 100} /></p>
              <p className="text-right text-preset-5 text-ink-muted">{' '}<Text id="Target of" />{' '}<Money value={targetOf} />
              </p>
            </div>
          </section>

          <div className="grid gap-50">
            <label htmlFor={amountInputId} className="text-preset-5-bold text-ink-muted"><Text id="Amount to Withdraw" /></label>
            <div className="relative">
              <p className="absolute left-250 top-[10px] text-preset-4 text-ink-muted">
                <CurrencySymbol />
              </p>
              <Input
                step="0.01"
                id={amountInputId}
                inputMode="decimal"
                max={totalSaved}
                min={0}
                type="number"
                value={amountToWithdraw}
                onChange={(event) => setAmountToWithdraw(event.target.value)}
                className="pl-[5rem]"
              />
            </div>
          </div>

          <Button type="submit" disabled className="text-preset-4-bold text-ink"><Text id="Confirm Withdrawal" /></Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
