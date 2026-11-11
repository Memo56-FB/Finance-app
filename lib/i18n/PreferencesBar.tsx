'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { savePreference } from './cookie'
import { useI18n } from './client'
export function PreferencesBar() {
  const locale = useI18n()
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
  return <aside className="flex flex-wrap items-center gap-x-300 gap-y-100 bg-white px-200 py-100 border-b border-beige-100 text-preset-5">
    <div className="flex items-center gap-100">
      <label htmlFor="preference-language">{locale.t('Language')}</label>
      <Select value={locale.language} disabled={pending} onValueChange={change}>
        <SelectTrigger id="preference-language" className="w-auto min-w-24"><SelectValue>{locale.language === 'en' ? 'English' : 'Español'}</SelectValue></SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="es">Español</SelectItem>
        </SelectContent>
      </Select>
    </div>
    {error && <p role="alert">{locale.t('Could not save preferences.')}</p>}
  </aside>
}
