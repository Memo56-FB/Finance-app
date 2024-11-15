'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import React from 'react'

export const DeleteBudget = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className='text-preset-4 text-red p-0'>Delete Budget</DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="grid justify-start gap-250">
          <DialogTitle className="text-start text-preset-2">Delete (This is category)</DialogTitle>
          <DialogDescription className="text-start">
            Are you sure you want to delete this budget? This action cannot be reversed, and all the data inside it will be removed forever.
          </DialogDescription>
        </DialogHeader>
        <Button variant={'destroy'}>Yes, Confirm Deletion</Button>
        <DialogClose className='text-preset-4 text-grey-500'>
          No, I want to go back
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
