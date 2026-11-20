'use client'

import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { HeartBreak } from '@phosphor-icons/react'
import React, { useId, useState } from 'react'

export const ResponsiveSelect = ({ options, label, children, value, onValueChange }: {
  options: { value: string; label: string }[]
  label: string
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
}) => {
  const selectId = useId()
  const [selectedValue, setSelectedValue] = useState(options[0]?.value ?? '')
  const currentValue = value ?? selectedValue
  const handleValueChange = (nextValue: string) => {
    setSelectedValue(nextValue)
    onValueChange?.(nextValue)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger aria-label={label} className='flex min-h-11 min-w-11 items-center justify-center md:hidden'>
          {/* ? An icon to show the dropdown menu */}
          {children}
          {/* ? An default icon for documenting stories */}
          {!children && <HeartBreak size={20} weight="fill" />}
        </DropdownMenuTrigger>
        <DropdownMenuContent className='px-250 py-150 rounded-lg *:p-0 text-preset-4 text-grey-900 grid gap-150'>
          <DropdownMenuRadioGroup value={currentValue} onValueChange={handleValueChange} aria-label={label} className="grid gap-150">
            {options.map((option, index) => (
              <React.Fragment key={option.value}>
                <DropdownMenuRadioItem value={option.value} className="p-0 [&>span]:hidden data-[state=checked]:text-preset-4-bold">
                  {option.label}
                </DropdownMenuRadioItem>
                {index < options.length - 1 && <DropdownMenuSeparator />}
              </React.Fragment>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className='items-center gap-100 hidden md:flex'>
        <label className='text-preset-4 text-grey-500 text-nowrap' htmlFor={selectId}>{label}</label>
        <Select value={currentValue} onValueChange={handleValueChange}>
          <SelectTrigger id={selectId}>
            <SelectValue>
              {options.find(option => option.value === currentValue)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className='px-250 py-150 rounded-lg text-preset-4 text-grey-900 [&>div]:grid [&>div]:p-0 [&>*]:gap-150'>
            {options.map((option, index) => {
              const activeStyle = option.value === currentValue ? 'text-preset-4-bold' : ''
              if (options.length === index + 1) {
                return (
                  <SelectItem key={option.value} value={option.value} className={`p-0 focus:text-preset-4-bold ${activeStyle}`} hideCheck={true}>
                    {option.label}
                  </SelectItem>
                )
              }
              return (
                <React.Fragment key={option.value}>
                  <SelectItem value={option.value} className={`p-0 focus:text-preset-4-bold ${activeStyle}`} hideCheck={true}>
                    {option.label}
                  </SelectItem>
                  <DropdownMenuSeparator />
                </React.Fragment>
              )
            })}
          </SelectContent>
        </Select>
      </div>
    </>
  )
}
