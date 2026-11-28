'use client'
import { Skeleton } from '@/components/ui/skeleton'
import { useSyncExternalStore, useTransition } from 'react'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { savePreference } from './cookie'
import { Text, useI18n } from './client'
import { defaultTheme, themes, validateTheme, type Theme } from './preferences'
import type { Messages } from './index'

const languages = {
  en: { label: 'English', flag: 'us' },
  es: { label: 'Español', flag: 'mx' },
}

const themeLabels: Record<Theme, keyof Messages> = {
  light: 'Light',
  dark: 'Dark',
}

const themeSwatches: Record<Theme, string> = {
  light: 'bg-[#eee6d4]',
  dark: 'bg-[hsl(253_25%_15%)]',
}

function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}

function useTheme(): Theme {
  return useSyncExternalStore(
    subscribeToTheme,
    () => validateTheme(document.documentElement.dataset.theme),
    () => defaultTheme,
  )
}

function ThemeSwatch({ theme }: { theme: Theme }) {
  return <span aria-hidden="true" className={`inline-block size-4 border-2 border-line ${themeSwatches[theme]}`} />
}

export function PreferencesBar({ authPage = false }: { authPage?: boolean }) {
  const locale = useI18n()
  const selected = languages[locale.language]
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const theme = useTheme()
  function change(value: string) {
    try {
      savePreference(document, value, location.protocol === 'https:')
      toast.dismiss('preference-error')
      startTransition(() => router.refresh())
    } catch { toast.error(<Text id="Could not save preferences."/>,{toastId:'preference-error',role:'alert',autoClose:false}) }
  }
  function changeTheme(value: string) {
    const previous = document.documentElement.dataset.theme
    try {
      savePreference(document, value, location.protocol === 'https:', 'theme')
      document.documentElement.dataset.theme = validateTheme(value)
      toast.dismiss('preference-error')
    } catch {
      if (previous) document.documentElement.dataset.theme = previous
      toast.error(<Text id="Could not save preferences."/>,{toastId:'preference-error',role:'alert',autoClose:false})
    }
  }
  const triggerClass = 'w-auto max-sm:gap-100 max-sm:px-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink'
  const languageSelect = <>
      <label htmlFor="preference-language" className="sr-only">{locale.t('Language')}</label>
      <Select value={locale.language} disabled={pending} onValueChange={change}>
        <SelectTrigger id="preference-language" aria-busy={pending} className={triggerClass}>
          <SelectValue>
            <span className="flex items-center gap-100">
              <Image src={`/flags/${selected.flag}.svg`} width={24} height={16} alt="" aria-hidden="true" />
              {selected.label}{pending && <Skeleton className="size-3 rounded-full"/>}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(languages).map(([value, { label, flag }]) => (
            <SelectItem key={value} value={value} textValue={label} className="focus:bg-background">
              <span className="flex items-center gap-100">
                <Image src={`/flags/${flag}.svg`} width={24} height={16} alt="" aria-hidden="true" />
                {label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
  </>
  const themeSelect = <>
      <label htmlFor="preference-theme" className="sr-only">{locale.t('Theme')}</label>
      <Select value={theme} onValueChange={changeTheme}>
        <SelectTrigger id="preference-theme" className={triggerClass}>
          <SelectValue>
            <span className="flex items-center gap-100">
              <ThemeSwatch theme={theme} />
              {locale.t(themeLabels[theme])}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {themes.map(value => (
            <SelectItem key={value} value={value} textValue={locale.t(themeLabels[value])} className="focus:bg-background">
              <span className="flex items-center gap-100">
                <ThemeSwatch theme={value} />
                {locale.t(themeLabels[value])}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
  </>
  return <aside className={cn(
    'flex shrink-0 items-center justify-between gap-100 px-200 py-100 md:gap-8 md:px-500 text-preset-5',
    authPage ? 'md:justify-end' : 'max-md:grow',
  )}>
    {authPage ? <>{themeSelect}{languageSelect}</> : <>{languageSelect}{themeSelect}</>}
  </aside>
}
