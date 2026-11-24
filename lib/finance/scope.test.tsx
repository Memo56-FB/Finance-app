// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PreferencesProvider } from '@/lib/i18n/client'
import { en } from '@/lib/i18n'
import { AccountScope } from './AccountScope'
import { ApiError } from '@/lib/api/client'
import { announceSessionChange } from '@/lib/auth/client'

const { currentAccount, navigate } = vi.hoisted(() => ({ currentAccount: vi.fn(), navigate: vi.fn() }))
vi.mock('@/lib/auth/client', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/auth/client')>(),
  currentAccount,
  useAccessNavigation: () => navigate,
}))

afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks()})
it('keeps idle account data on window focus and tab return', async ()=>{
  vi.useFakeTimers()
  currentAccount.mockReset().mockResolvedValue({username:'account-a'})
  const client=new QueryClient(),invalidate=vi.spyOn(client,'invalidateQueries').mockResolvedValue()
  vi.spyOn(document,'visibilityState','get').mockReturnValue('visible')
  render(<QueryClientProvider client={client}><PreferencesProvider preferences={{language:'en'}} messages={en}><AccountScope account="account-a">private</AccountScope></PreferencesProvider></QueryClientProvider>)
  await act(async () => {})
  await act(async () => {
    vi.advanceTimersByTime(180_000)
    document.dispatchEvent(new Event('visibilitychange'))
    window.dispatchEvent(new Event('focus'))
  })
  expect(currentAccount).toHaveBeenCalledOnce()
  expect(invalidate).not.toHaveBeenCalled()
})

it('pauses actions during identity verification, keeps a matching draft and discards a changed identity', async () => {
  currentAccount.mockReset().mockResolvedValue({username:'account-a'})
  const client = new QueryClient()
  render(<QueryClientProvider client={client}><PreferencesProvider preferences={{language:'en'}} messages={en}>
    <AccountScope account="account-a"><input aria-label="Draft" defaultValue="My draft"/></AccountScope>
  </PreferencesProvider></QueryClientProvider>)
  await act(async () => {})
  const field = screen.getByLabelText('Draft')
  const pending = Promise.withResolvers<{username:string}>()
  currentAccount.mockReturnValueOnce(pending.promise)
  await act(async () => {
    window.dispatchEvent(new Event('finance-session-expired'))
    window.dispatchEvent(new Event('finance-session-expired'))
  })
  expect(currentAccount).toHaveBeenCalledTimes(2)
  expect(field.closest('[inert]')).toBeInTheDocument()
  await act(async () => { pending.resolve({username:'account-a'}) })
  expect(field).toHaveValue('My draft')
  expect(field.closest('[inert]')).toBeNull()
  currentAccount.mockRejectedValueOnce(new ApiError(503))
  announceSessionChange()
  const retry = await screen.findByRole('button', {name:'Retry session check'})
  expect(field.closest('[inert]')).toBeInTheDocument()
  currentAccount.mockResolvedValueOnce({username:'account-b'})
  await act(async () => { fireEvent.click(retry) })
  expect(field).not.toBeInTheDocument()
  expect(navigate).toHaveBeenCalledOnce()
})

it('keeps cached content on a routine failure and conceals it on a session signal', async () => {
  currentAccount.mockReset().mockResolvedValue({username:'account-a'})
  const client = new QueryClient()
  render(<QueryClientProvider client={client}><PreferencesProvider preferences={{language:'en'}} messages={en}>
    <AccountScope account="account-a"><p>Cached private content</p></AccountScope>
  </PreferencesProvider></QueryClientProvider>)
  await act(async () => {})
  const content = screen.getByText('Cached private content')
  const delayed = Promise.withResolvers<{username:string}>()
  currentAccount.mockReturnValueOnce(delayed.promise)
  await act(async () => {
    window.dispatchEvent(new Event('finance-navigation'))
    window.dispatchEvent(new Event('finance-navigation'))
  })
  expect(currentAccount).toHaveBeenCalledTimes(2)
  expect(content.closest('[inert]')).toBeNull()
  await act(async () => { delayed.reject(new ApiError(503)) })
  await screen.findByRole('button', {name:'Retry session check'})
  expect(content.closest('[inert]')).toBeNull()
  currentAccount.mockRejectedValueOnce(new ApiError(503))
  await act(async () => { announceSessionChange() })
  expect(content.closest('[inert]')).toHaveClass('hidden')
})
