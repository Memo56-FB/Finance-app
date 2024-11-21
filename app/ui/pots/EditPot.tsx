'use client'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { SelectColorTag } from "@/components/ui/SelectColorTag"
import { colorTags } from "@/lib/utils"
export const EditPot = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className='text-preset-4 text-grey-900 p-0'>Edit Pot</DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="w-[320px] px-250 py-300 rounded-xl md:w-full grid gap-250">
        <DialogHeader className="grid justify-start gap-250">
          <DialogTitle className="text-start">Edit Pot</DialogTitle>
          <DialogDescription className="text-start">
            If your saving targets change, feel free to update your pots.
          </DialogDescription>
        </DialogHeader>
        <form action="" className="grid gap-200">
          <div className="grid gap-50">
            <label htmlFor="name" className="text-preset-5-bold text-grey-500">Pot Name</label>
            <Input placeholder="e.g. Rainy Days" />
            <span className="text-right text-preset-5 text-grey-500">x charactes left</span>
          </div>
          <div className="grid gap-50">
            <label htmlFor="name" className="text-preset-5-bold text-grey-500">Target</label>
            <div className="relative">
              <p className="text-beige-500 absolute left-250 top-[10px] text-preset-4">
                $
              </p>
              <Input placeholder="e.g. 2000" className="pl-500" />
            </div>
          </div>
          <div className="grid gap-50">
            <label htmlFor="name" className="text-preset-5-bold text-grey-500">Theme</label>
            <SelectColorTag
              options={colorTags}
            />
          </div>
          <Button className="text-preset-4-bold text-white">
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
