'use client'

import { ControlledLabel, useI18n } from '@/lib/i18n/client'
import React, { Fragment } from 'react'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from './select'

export const SelectColorTag = ({
  options,
  id,
}: {
  id?: string
  options: {
    value: string
    label: string
  }[]
}) => {
  const { t } = useI18n()

  return (
    <Select>
        <SelectTrigger id={id} aria-label={id ? undefined : t('Color Tag')}>
          <SelectValue placeholder={t("Pick a color")}/>
        </SelectTrigger>
      <SelectContent >
        {options.map( option => (
          <Fragment key={option.value}>
            <SelectItem
              key={option.value}
              value={option.value}
            >
              <div className='grid gap-150 grid-cols-[auto_auto] items-center w-full'>
                <span className={`h-3 w-3 rounded-full bg-${option.value}`} />
                <ControlledLabel value={option.label} />
              </div>
            </SelectItem>
            <SelectSeparator className='bg-beige-100 w-[87%] mx-auto' />
          </Fragment>
        ))}
      </SelectContent>
    </Select>
  )
}
