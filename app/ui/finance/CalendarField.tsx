'use client'

import { useId, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { CalendarDays } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { enUS } from 'react-day-picker/locale/en-US'
import { es } from 'react-day-picker/locale/es'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { validMonth } from '@/lib/api/finance-path'
import { calendarDate } from '@/lib/finance/contracts'
import { useI18n } from '@/lib/i18n/client'
import type { Label } from './common'

type Props = {
  label: Label
  value: string
  onChange: (value: string) => void
  monthOnly?: boolean
  applyMonthOnNavigate?: boolean
  error?: string
}

export function CalendarField({label, value, onChange, monthOnly = false, applyMonthOnNavigate = false, error}: Props) {
  const {t, language} = useI18n()
  const id = useId()
  const [open, setOpen] = useState(false)
  const [monthDraft, setMonthDraft] = useState<string>()
  const [page, setPage] = useState<Date>()
  const date = monthOnly ? value + '-01' : value
  const selected = calendarDate(date) ? parseISO(date) : undefined
  const pattern = monthOnly ? 'yyyy-MM' : 'yyyy-MM-dd'

  function accept(date: Date) {
    onChange(format(date, pattern))
    setMonthDraft(undefined)
    setOpen(false)
  }

  return <div className="grid min-w-0 gap-50">
    <label htmlFor={id} className="text-preset-5-bold text-grey-500">{t(label)}</label>
    <div className="relative">
      <Input id={id} type="text" value={monthDraft ?? value} placeholder={pattern}
        className={monthOnly ? 'w-40 pr-11' : 'w-full pr-11'} required={!monthOnly}
        aria-invalid={!!error || undefined} aria-describedby={error ? id + '-error' : undefined}
        onBlur={() => setMonthDraft(undefined)}
        onChange={event => {
          const text = event.target.value
          if (monthOnly && text && !validMonth(text)) setMonthDraft(text)
          else {
            setMonthDraft(undefined)
            onChange(text)
          }
        }}/>
      <Popover.Root open={open} onOpenChange={next => {
        if (next) setPage(selected ?? new Date())
        setOpen(next)
      }}>
        <Popover.Trigger type="button" aria-label={t('Open calendar') + ' · ' + t(label)}
          className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-md text-grey-500 hover:text-grey-900 focus-visible:ring-2">
          <CalendarDays aria-hidden="true" size={18}/>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content aria-label={t(label)} sideOffset={4} collisionPadding={8} align="end"
            className="z-50 max-h-[var(--radix-popover-content-available-height)] overflow-auto rounded-lg border border-grey-100 bg-white shadow-lg">
            {page && <Calendar mode="single" selected={selected} month={page} onMonthChange={next => {
              setPage(next)
              if (applyMonthOnNavigate) onChange(format(next, pattern))
            }}
              onSelect={day => { if (day) accept(day) }} required
              locale={language === 'es' ? es : enUS} captionLayout="dropdown"
              startMonth={parseISO(String(Math.max(1, page.getFullYear() - 100)).padStart(4, '0') + '-01-01')}
              endMonth={parseISO(String(Math.min(9999, page.getFullYear() + 100)).padStart(4, '0') + '-12-01')}
              components={monthOnly ? { MonthGrid: () => <></> } : undefined}
              className={monthOnly ? 'min-w-60' : undefined}
              footer={monthOnly && <Button type="button" className="mt-2 h-9 w-full" onClick={() => accept(page)}>{t('Select month')}</Button>}
            />}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
    {error && <p id={id + '-error'} className="text-preset-5 text-red">{error}</p>}
  </div>
}
