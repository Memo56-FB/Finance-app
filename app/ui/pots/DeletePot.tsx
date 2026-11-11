'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'

export const DeletePot = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className='text-preset-4 text-red p-0'>Delete Pot</DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="grid justify-start gap-250">
          <DialogTitle className="text-start text-preset-2">Delete (This is pot)</DialogTitle>
          <DialogDescription className="text-start">
            Deletion is unavailable in this demo. Your savings pot will stay unchanged.
          </DialogDescription>
        </DialogHeader>
        <Button type="button" disabled variant={'destroy'}>Yes, Confirm Deletion</Button>
        <DialogClose className='text-preset-4 text-grey-500'>
          No, I want to go back
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
