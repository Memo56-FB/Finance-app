'use client'

import { useI18n } from '@/lib/i18n/client'
import { InputSearch } from '@/components/ui/InputSearch'
import { ResponsiveSelect } from '@/components/ui/ResponsiveSelect'
import { SortAscending } from '@phosphor-icons/react'
import { sortOptions } from './data'

type RecurringBillsToolbarProps = {
  searchQuery: string
  sortBy: string
  onSearchQueryChange: (searchQuery: string) => void
  onSortChange: (sortBy: string) => void
}

export const RecurringBillsToolbar = ({
  searchQuery,
  sortBy,
  onSearchQueryChange,
  onSortChange,
}: RecurringBillsToolbarProps) => {
  const { t, messages } = useI18n()

  return (
    <div className='flex items-center justify-between gap-300'>
      <InputSearch
        aria-label={t("Search bills")}
        type='text'
        placeholder={t("Search bills")}
        value={searchQuery}
        onChange={(event) => onSearchQueryChange(event.target.value)}
      />
      <ResponsiveSelect
        label={t("Sort by")}
        options={sortOptions.map(value => ({ value, label: messages[value as keyof typeof messages] ?? value }))}
        value={sortBy}
        onValueChange={onSortChange}
      >
        <SortAscending weight='fill' size={20} className='text-ink' />
      </ResponsiveSelect>
    </div>
  )
}
