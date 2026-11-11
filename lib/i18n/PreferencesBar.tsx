'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { savePreference } from './cookie'
import { useI18n } from './client'

const languages = {
  en: { label: 'English', flag: 'us' },
  es: { label: 'Español', flag: 'mx' },
}

export function PreferencesBar() {
  const locale = useI18n()
  const selected = languages[locale.language]
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState(false)
  function change(value: string) {
    setError(false)
    try {
      savePreference(document, value, location.protocol === 'https:')
      startTransition(() => router.refresh())
    } catch { setError(true) }
  }
  return <aside className="flex shrink-0 flex-col items-end gap-100 px-200 py-100 md:px-500 text-preset-5 lg:absolute lg:right-0 lg:top-0 lg:z-10">
      <label htmlFor="preference-language" className="sr-only">{locale.t('Language')}</label>
      <Select value={locale.language} disabled={pending} onValueChange={change}>
        <SelectTrigger id="preference-language" className="w-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grey-900">
          <SelectValue>
            <span className="flex items-center gap-100">
              <Image src={`/flags/${selected.flag}.svg`} width={24} height={16} alt="" aria-hidden="true" />
              {selected.label}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(languages).map(([value, { label, flag }]) => (
            <SelectItem key={value} value={value} textValue={label} className="focus:bg-beige-100">
              <span className="flex items-center gap-100">
                <Image src={`/flags/${flag}.svg`} width={24} height={16} alt="" aria-hidden="true" />
                {label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    {error && <p role="alert" className="text-right">{locale.t('Could not save preferences.')}</p>}
  </aside>
}
