'use client'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import React, { useState } from 'react'

export const ResponsiveSelect = ({ options, children }: {
  options: string[]
  children: React.ReactNode
}) => {
  const [selectedValue, setSelectedValue] = useState('latest')

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className='flex md:hidden'>
          {children}
        </DropdownMenuTrigger>
        <DropdownMenuContent className='px-250 py-150 rounded-lg *:p-0 text-preset-4 text-grey-900 grid gap-150'>
          {options.map((option, index) => {
            if(options.length === index + 1){
              return (
                <DropdownMenuItem key={option}>
                  {option}
                </DropdownMenuItem>
              )
            }
            return (
              <React.Fragment key={option}>
                <DropdownMenuItem>{option}</DropdownMenuItem>
                <DropdownMenuSeparator/>
              </React.Fragment>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      <Select value={selectedValue} onValueChange={(value) => setSelectedValue(value)}>
        <SelectTrigger className="w-[180px] hidden md:flex">
          <SelectValue>
            {selectedValue}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className='px-250 py-150 rounded-lg text-preset-4 text-grey-900 [&>div]:grid [&>div]:p-0 [&>*]:gap-150'>
          {options.map((option, index) => {
            if(options.length === index + 1){
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
    </>
  )
}
