'use client'

import { CurrencySymbol, Text, useI18n } from '@/lib/i18n/client'
import { useId } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { SelectColorTag } from "@/components/ui/SelectColorTag"
import { colorTags } from "@/lib/utils"

export const CreatePot = () => {
  const { t } = useI18n()

  const formId = useId()
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className='flex text-preset-4 text-white'><Text id="+ Add New Pot" /></Button>
      </DialogTrigger>
      <DialogContent className="w-[320px] px-250 py-300 rounded-xl md:w-full grid gap-250">
        <DialogHeader className="grid justify-start gap-250">
          <DialogTitle className="text-start"><Text id="Add New Pot" /></DialogTitle>
          <DialogDescription className="text-start"><Text id="Create a pot to set savings targets. Changes are not saved in this demo." /></DialogDescription>
        </DialogHeader>
        <form method="post" onSubmit={(event) => event.preventDefault()} className="grid gap-200">
          <div className="grid gap-50">
            <label htmlFor={`${formId}-name`} className="text-preset-5-bold text-grey-500"><Text id="Pot Name" /></label>
            <Input id={`${formId}-name`} placeholder={t("e.g. Rainy Days")} />
            <span className="text-right text-preset-5 text-grey-500"><Text id="x charactes left" /></span>
          </div>
          <div className="grid gap-50">
            <label htmlFor={`${formId}-target`} className="text-preset-5-bold text-grey-500"><Text id="Target" /></label>
            <div className="relative">
              <p className="text-beige-500 absolute left-250 top-[10px] text-preset-4">
                <CurrencySymbol />
              </p>
              <Input id={`${formId}-target`} type="number" min={0} step="0.01" placeholder={t("e.g. 2000")} className="pl-[5rem]" />
            </div>
          </div>
          <div className="grid gap-50">
            <label htmlFor={`${formId}-theme`} className="text-preset-5-bold text-grey-500"><Text id="Theme" /></label>
            <SelectColorTag
              id={`${formId}-theme`}
              options={colorTags}
            />
          </div>
          <Button type="submit" disabled className="text-preset-4-bold text-white"><Text id="Add Pot" /></Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
