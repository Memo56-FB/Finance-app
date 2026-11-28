'use client'

import { useI18n } from '@/lib/i18n/client'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { DotsThreeOutline } from '@phosphor-icons/react/dist/ssr'
import React from 'react'
import { EditBudget } from './EditBudget'
import { DeleteBudget } from './DeleteBudget'

export const EditDeleteDropdown = () => {
  const { t } = useI18n()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={t("Budget actions")}>
        <DotsThreeOutline className="text-ink-muted" size={16} weight="fill" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='bg-card rounded-none px-250 py-150 grid gap-150'>
        <EditBudget />
        <Separator className='bg-line' />
        <DeleteBudget />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
