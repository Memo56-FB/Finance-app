'use client'

import { ControlledLabel, useI18n } from '@/lib/i18n/client'
import React, { Fragment } from 'react'
import { safeColor } from '@/lib/finance/colors'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from './select'

export const SelectColorTag = ({
  options,
  id,
  value,
  onValueChange,
}: {
  id?: string
  value?: string
  onValueChange?: (value: string) => void
  options: {
    value: string
    label: string
  }[]
}) => {
  const { t } = useI18n()

  const choices = value && !options.some(option => option.value === value) && /^#[\da-f]{6}$/i.test(value) ? [...options, { value, label: value }] : options
  return (
    <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} aria-label={id ? undefined : t('Color Tag')}>
          <SelectValue placeholder={t("Pick a color")}/>
        </SelectTrigger>
      <SelectContent >
        {choices.map( option => (
          <Fragment key={option.value}>
            <SelectItem
              key={option.value}
              value={option.value}
            >
              <div className='grid gap-150 grid-cols-[auto_auto] items-center w-full'>
                <span className='h-3 w-3 rounded-full' style={{ backgroundColor:safeColor(option.value) }} />
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
