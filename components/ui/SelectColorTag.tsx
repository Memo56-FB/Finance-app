import React, { Fragment } from 'react'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from './select'

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
          <Fragment key={option.value}>
            <SelectItem
              key={option.value}
              value={option.value}
            >
              <div className='grid gap-150 grid-cols-[auto_auto] items-center w-full'>
                <span className={`h-3 w-3 rounded-full bg-${option.value}`} />
                {option.label}
              </div>
            </SelectItem>
            <SelectSeparator className='bg-beige-100 w-[87%] mx-auto' />
          </Fragment>
        ))}
      </SelectContent>
    </Select>
  )
}
