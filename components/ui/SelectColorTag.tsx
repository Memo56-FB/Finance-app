import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

export const SelectColorTag = ({
  options
}: {
  options: {
    value: string
    label: string
  }[]
}) => {

  return (
    <Select>
      {/* TODO: revisar como estructurar esto para ponerlo en mis forms */}
      {/* <FormControl> */}
        <SelectTrigger>
          <SelectValue placeholder='Pick a color'/>
        </SelectTrigger>
      {/* </FormControl> */}
      <SelectContent >
        {options.map( option => (
          <SelectItem
            key={option.value}
            value={option.value}
          >
            <div className='grid gap-150 grid-cols-[auto_auto] items-center'>
              <span className={`h-3 w-3 rounded-full bg-${option.value}`} />
              {option.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
