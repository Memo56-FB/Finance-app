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
  return (
    <div className='flex items-center justify-between gap-300'>
      <InputSearch
        type='text'
        placeholder='Search bills'
        value={searchQuery}
        onChange={(event) => onSearchQueryChange(event.target.value)}
      />
      <ResponsiveSelect
        label='Sort by'
        options={sortOptions}
        value={sortBy}
        onValueChange={onSortChange}
      >
        <SortAscending weight='fill' size={20} className='text-grey-900' />
      </ResponsiveSelect>
    </div>
  )
}
