'use client'

import { Text } from '@/lib/i18n/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import React from 'react'

export const DeleteBudget = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className='text-preset-4 text-red p-0'><Text id="Delete Budget" /></DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="grid justify-start gap-250">
          <DialogTitle className="text-start text-preset-2"><Text id="Delete (This is category)" /></DialogTitle>
          <DialogDescription className="text-start"><Text id="Deletion is unavailable in this demo. Your budget will stay unchanged." /></DialogDescription>
        </DialogHeader>
        <Button type="button" disabled variant={'destroy'}><Text id="Yes, Confirm Deletion" /></Button>
        <DialogClose className='text-preset-4 text-grey-500'><Text id="No, I want to go back" /></DialogClose>
      </DialogContent>
    </Dialog>
  )
}
