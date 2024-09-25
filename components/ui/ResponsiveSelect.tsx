'use client'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { HeartBreak } from '@phosphor-icons/react'
import React, { useState } from 'react'

export const ResponsiveSelect = ({ options, label, children }: {
  options: string[]
  label: string
  children: React.ReactNode
}) => {
  const [selectedValue, setSelectedValue] = useState(options[0])

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className='flex md:hidden'>
          {/* ? An icon to show the dropdown menu */}
          {children}
          {/* ? An default icon for documenting stories */}
          {!children && <HeartBreak size={20} weight="fill" />}
        </DropdownMenuTrigger>
        <DropdownMenuContent className='px-250 py-150 rounded-lg *:p-0 text-preset-4 text-grey-900 grid gap-150'>
          {options.map((option, index) => {
            const activeStyle = option === selectedValue ? 'text-preset-4-bold' : ''
            if (options.length === index + 1) {
              return (
                <DropdownMenuItem
                  className={activeStyle}
                  key={option}
                  onClick={() => setSelectedValue(option)}
                >
                  {option}
                </DropdownMenuItem>
              )
            }
            return (
              <React.Fragment key={option}>
                <DropdownMenuItem
                  onClick={() => setSelectedValue(option)}
                  className={activeStyle}
                >
                  {option}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </React.Fragment>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className='items-center gap-100 hidden md:flex'>
        <label className='text-preset-4 text-grey-500 text-nowrap' htmlFor="">{label}</label>
        <Select value={selectedValue} onValueChange={(value) => setSelectedValue(value)}>
          <SelectTrigger>
            <SelectValue>
              {selectedValue}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className='px-250 py-150 rounded-lg text-preset-4 text-grey-900 [&>div]:grid [&>div]:p-0 [&>*]:gap-150'>
            {options.map((option, index) => {
              if (options.length === index + 1) {
                return (
                  <SelectItem key={option} value={option} className='p-0 focus:text-preset-4-bold' hideCheck={true}>
                    {option}
                  </SelectItem>
                )
              }
              return (
                <React.Fragment key={option}>
                  <SelectItem value={option} className='p-0 focus:text-preset-4-bold' hideCheck={true}>
                    {option}
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
