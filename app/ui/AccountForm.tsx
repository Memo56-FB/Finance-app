'use client'
import { useSyncExternalStore, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/client'
import type { Messages } from '@/lib/i18n/messages/en'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputPassword } from '@/components/ui/InputPassword'
import { api, ApiError } from '@/lib/api/client'
import { announceSessionChange, currentAccount, useAccessNavigation } from '@/lib/auth/client'
import { safeNext } from '@/lib/auth/types'
import { registrationErrors, type Credentials } from '@/lib/auth/validation'

const subscribe = () => () => {}
type Props = { register?: boolean; next?: string; unavailable?: boolean }
const fieldMessages = { name: 'Review your name (1–100 characters).', email: 'Enter a valid email (up to 254 characters).', password: 'Use at least 8 characters and at most 72 UTF-8 bytes.' } as const
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
    mutationFn: async ({ action, values }: { action: 'account' | 'guest'; values?: Credentials }) => {
      if (action === 'guest') {
        await api.post('guest')
        announceSessionChange()
        await navigate(target)
        return
      }
      if (!values) return
      if (register) {
        await api.post('register', { ...values, name: values.name.trim(), email: values.email.trim().toLowerCase() })
        setCreated(true)
      } else {
        if (!confirming) {
          await api.post('login', new URLSearchParams({ email: values.email.trim().toLowerCase(), password: values.password }))
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
    const values = data ? { name: String(data.get('name') ?? ''), email: String(data.get('email') ?? ''), password: String(data.get('password') ?? '') } : undefined
    const invalid = register && action === 'account' && values ? registrationErrors(values) : []
    setFields(invalid); setError(null)
    if (invalid.length) return
    busy.current = true
    try {
      await mutation.mutateAsync({ action, values })
      if (form) (form.elements.namedItem('password') as HTMLInputElement).value = ''
    } catch (cause) {
      const e = cause instanceof ApiError ? cause : new ApiError(0)
      setFields(e.status === 409 ? ['email'] : e.fields)
      setError(e.status === 409 ? 'This email is already registered.' : e.status === 401 ? 'Invalid email or password.' : e.status === 403 ? 'Your security token expired. Please retry.' : e.status === 400 ? 'Please review the marked fields.' : 'Authentication is unavailable. Please retry.')
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
        {(['name', 'email', 'password'] as const).filter(field => register || field !== 'name').map(field => {
          const invalid = fields.includes(field)
          const props = { id: field, name: field, required: !confirming, autoComplete: field === 'password' ? register ? 'new-password' : 'current-password' : field, 'aria-invalid': invalid, 'aria-describedby': invalid ? field + '-error' : undefined }
          return <div className="grid gap-50" key={field}>
            <label htmlFor={field} className="text-preset-5-bold text-grey-500">{t(field === 'name' ? 'Name' : field === 'email' ? 'Email' : register ? 'Create Password' : 'Password')}</label>
            {field === 'password' ? <InputPassword {...props} /> : <Input {...props} type={field === 'email' ? 'email' : 'text'} />}
            {invalid && <p id={field + '-error'} className="text-preset-5 text-red">{t(fieldMessages[field])}</p>}
          </div>
        })}
        <Button type="submit">{t(mutation.isPending ? 'Please wait…' : confirming ? 'Retry session check' : register ? 'Create Account' : 'Login')}</Button>
      </fieldset>}
    <Button type="button" variant="secondary" disabled={!ready || mutation.isPending} onClick={() => void run('guest')}>{t('Continue as guest')}</Button>
    <div className="flex flex-wrap gap-100 text-preset-4">
      <p className="text-grey-500">{t(register ? 'Already have an account?' : 'Need to create an account?')}</p>
      <Link aria-disabled={mutation.isPending} onClick={event => { if (mutation.isPending) event.preventDefault() }} className="underline" href={(register ? '/login' : '/singup') + query}>{t(register ? 'Login' : 'Sign Up')}</Link>
    </div>
  </form>
}
