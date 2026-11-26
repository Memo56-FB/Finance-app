'use client'
import { Skeleton } from '@/components/ui/skeleton'
import { useTransition } from 'react'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { savePreference } from './cookie'
import { Text, useI18n } from './client'

const languages = {
  en: { label: 'English', flag: 'us' },
  es: { label: 'Español', flag: 'mx' },
}

export function PreferencesBar() {
  const locale = useI18n()
  const selected = languages[locale.language]
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  function change(value: string) {
    try {
      savePreference(document, value, location.protocol === 'https:')
      toast.dismiss('preference-error')
      startTransition(() => router.refresh())
    } catch { toast.error(<Text id="Could not save preferences."/>,{toastId:'preference-error',role:'alert',autoClose:false}) }
  }
  return <aside className="flex shrink-0 flex-col items-end gap-100 px-200 py-100 md:px-500 text-preset-5">
      <label htmlFor="preference-language" className="sr-only">{locale.t('Language')}</label>
      <Select value={locale.language} disabled={pending} onValueChange={change}>
        <SelectTrigger id="preference-language" aria-busy={pending} className="w-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grey-900">
          <SelectValue>
            <span className="flex items-center gap-100">
              <Image src={`/flags/${selected.flag}.svg`} width={24} height={16} alt="" aria-hidden="true" />
              {selected.label}{pending && <Skeleton className="size-3 rounded-full"/>}
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
  </aside>
}
