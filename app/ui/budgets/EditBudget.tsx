'use client'

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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SelectColorTag } from "@/components/ui/SelectColorTag"
import { colorTags } from "@/lib/utils"
import { budgets } from './data'


export const EditBudget = () => {
  const formId = useId()
  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className='text-preset-4 text-grey-900 p-0'>Edit Budget</DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="w-[320px] px-250 py-300 rounded-xl md:w-full grid gap-250">
        <DialogHeader className="grid justify-start gap-250">
          <DialogTitle className="text-start">Edit Budget</DialogTitle>
          <DialogDescription className="text-start">
            Preview changes to your spending limits. Changes are not saved in this demo.
          </DialogDescription>
        </DialogHeader>
        <form method="post" onSubmit={(event) => event.preventDefault()} className="grid gap-200">
          <div className="grid gap-50">
            <label htmlFor={`${formId}-category`} className="text-preset-5-bold text-grey-500">Budget Category</label>
            <Select>
              <SelectTrigger id={`${formId}-category`}>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {budgets.map(({ title }) => <SelectItem key={title} value={title}>{title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-50">
            <label htmlFor={`${formId}-limit`} className="text-preset-5-bold text-grey-500">Maximum Spending</label>
            <div className="relative">
              <p className="text-beige-500 absolute left-250 top-[10px] text-preset-4">
                $
              </p>
              <Input id={`${formId}-limit`} type="number" min={0} step="0.01" placeholder="e.g. 2000" className="pl-500" />
            </div>
          </div>
          <div className="grid gap-50">
            <label htmlFor={`${formId}-theme`} className="text-preset-5-bold text-grey-500">Color Tag</label>
            <SelectColorTag
              id={`${formId}-theme`}
              options={colorTags}
            />
          </div>
          <Button type="submit" disabled className="text-preset-4-bold text-white">
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog >

  )
}
