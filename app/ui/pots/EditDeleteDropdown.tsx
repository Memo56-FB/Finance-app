import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { DotsThreeOutline } from '@phosphor-icons/react/dist/ssr'
import React from 'react'
import { EditPot } from './EditPot'
import { DeletePot } from './DeletePot'

export const EditDeleteDropdown = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <DotsThreeOutline className="text-grey-300" size={16} weight="fill" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='bg-white rounded-md px-250 py-150 grid gap-150'>
        <EditPot />
        <Separator className='bg-grey-100' />
        <DeletePot />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
