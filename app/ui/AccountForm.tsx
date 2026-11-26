'use client'
import { useSyncExternalStore, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/client'
import type { Messages } from '@/lib/i18n/messages/en'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputPassword } from '@/components/ui/InputPassword'
import { api, ApiError } from '@/lib/api/client'
import { announceSessionChange, currentAccount, useAccessNavigation } from '@/lib/auth/client'
import { safeNext } from '@/lib/auth/types'
import { credentialErrors, type Credentials } from '@/lib/auth/validation'

const subscribe = () => () => {}
type Props = { register?: boolean; next?: string; unavailable?: boolean }
const fieldMessages = { name: 'Review your name (1–100 characters).', username: 'Use 1–254 letters (A–Z), numbers, periods, hyphens or underscores.', password: 'Use at least 8 characters and at most 72 UTF-8 bytes.' } as const
export function AccountForm({ register = false, next, unavailable = false }: Props) {
  const { t } = useI18n()
  const ready = useSyncExternalStore(subscribe, () => true, () => false)
  const [created, setCreated] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<keyof Messages | null>(unavailable ? 'Authentication is unavailable. Please retry.' : null)
  const [fields, setFields] = useState<string[]>([])
  const busy = useRef(false)
  const navigate = useAccessNavigation()
  const target = safeNext(next)
  const query = '?' + new URLSearchParams({ next: target })
  const mutation = useMutation({
    mutationFn: async ({ action, values, remember }: { action: 'account' | 'guest'; values?: Credentials; remember: boolean }) => {
      if (action === 'guest') {
        await api.post('guest')
        announceSessionChange()
        await navigate(target)
        return
      }
      if (!values) return
      if (register) {
        await api.post('register', { ...values, name: values.name.trim(), username: values.username.trim().toLowerCase() })
        setCreated(true)
      } else {
        if (!confirming) {
          const body = new URLSearchParams({ username: values.username.trim().toLowerCase(), password: values.password })
          if (remember) body.set('remember-me', 'true')
          await api.post('login', body)
          setConfirming(true)
        }
        try {
          await currentAccount()
        } catch (cause) {
          if (!(cause instanceof ApiError && cause.status === 401)) throw new ApiError(503)
          setConfirming(false)
          setError('Your session expired. Please sign in again.')
          return
        }
        announceSessionChange()
        await navigate(target)
      }
    },
    retry: false, networkMode: 'always', gcTime: 0,
  })
  async function run(action: 'account' | 'guest', form?: HTMLFormElement) {
    if (busy.current) return
    const data = form ? new FormData(form) : undefined
    const values = data ? { name: String(data.get('name') ?? ''), username: String(data.get('username') ?? ''), password: String(data.get('password') ?? '') } : undefined
    const invalid = !confirming && action === 'account' && values ? credentialErrors(values, register) : []
    setFields(invalid); setError(null)
    if (invalid.length) return
    busy.current = true
    try {
      await mutation.mutateAsync({ action, values, remember: data?.has('remember-me') ?? false })
      if (form) (form.elements.namedItem('password') as HTMLInputElement).value = ''
    } catch (cause) {
      const e = cause instanceof ApiError ? cause : new ApiError(0)
      setFields(e.status === 409 ? ['username'] : e.fields)
      setError(e.status === 409 ? 'This username is already registered.' : e.status === 401 ? 'Invalid username or password.' : e.status === 403 ? 'Your security token expired. Please retry.' : e.status === 400 ? 'Please review the marked fields.' : 'Authentication is unavailable. Please retry.')
    } finally {
      busy.current = false
      mutation.reset()
    }
  }
  return <form method="post" onSubmit={event => { event.preventDefault(); void run('account', event.currentTarget) }}
    className="bg-white px-250 md:px-400 py-300 gap-300 rounded-xl grid w-full md:max-w-[560px]">
    <h1 className="text-preset-1">{t(register ? 'Sign Up' : 'Login')}</h1>
    <noscript>{t('Enable JavaScript to use these forms.')}</noscript>
    {error && <p role="alert" className="text-preset-5 text-red">{t(error)}</p>}
    {unavailable && <Button type="button" variant="secondary" disabled={!ready || mutation.isPending} onClick={() => window.location.reload()}>{t("Retry session check")}</Button>}
    {created ? <><p role="status">{t('Account created. Please log in.')}</p><Link className="underline" href={'/login' + query}>{t('Login')}</Link></> :
      <fieldset disabled={!ready || mutation.isPending} className="grid gap-300 min-w-0" aria-busy={mutation.isPending}>
        {(['name', 'username', 'password'] as const).filter(field => register || field !== 'name').map(field => {
          const invalid = fields.includes(field)
          const props = { id: field, name: field, required: !confirming, autoComplete: field === 'password' ? register ? 'new-password' : 'current-password' : field, 'aria-invalid': invalid, 'aria-describedby': invalid ? field + '-error' : undefined }
          return <div className="grid gap-50" key={field}>
            <label htmlFor={field} className="text-preset-5-bold text-grey-500">{t(field === 'name' ? 'Name' : field === 'username' ? 'Username' : register ? 'Create Password' : 'Password')}</label>
            {field === 'password' ? <InputPassword {...props} /> : <Input {...props} type="text" {...(field === 'username' && { autoCapitalize: 'none', autoCorrect: 'off', spellCheck: false })} />}
            {invalid && <p id={field + '-error'} className="text-preset-5 text-red">{t(fieldMessages[field])}</p>}
          </div>
        })}
        {!register && !confirming && <label className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-100 text-preset-4 text-grey-900 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
          <input type="checkbox" name="remember-me" value="true" className="h-4 w-4 accent-green" />
          {t('Remember me')}
        </label>}
        <Button type="submit" aria-busy={mutation.isPending && mutation.variables?.action === 'account'}>
          {t(confirming ? 'Retry session check' : register ? 'Create Account' : 'Login')}
          {mutation.isPending && mutation.variables?.action === 'account' && <Skeleton className="ml-2 size-3 rounded-full opacity-70"/>}
        </Button>
      </fieldset>}
    <Button type="button" variant="secondary" disabled={!ready || mutation.isPending} aria-busy={mutation.isPending && mutation.variables?.action === 'guest'} onClick={() => void run('guest')}>
      {t('Continue as guest')}
      {mutation.isPending && mutation.variables?.action === 'guest' && <Skeleton className="ml-2 size-3 rounded-full"/>}
    </Button>
    <div className="flex flex-wrap gap-100 text-preset-4">
      <p className="text-grey-500">{t(register ? 'Already have an account?' : 'Need to create an account?')}</p>
      <Link aria-disabled={mutation.isPending} onClick={event => { if (mutation.isPending) event.preventDefault() }} className="underline" href={(register ? '/login' : '/singup') + query}>{t(register ? 'Login' : 'Sign Up')}</Link>
    </div>
  </form>
}
