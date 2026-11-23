// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PreferencesProvider } from '@/lib/i18n/client'
import { en } from '@/lib/i18n'
import { AccountScope } from './AccountScope'
import { ApiError } from '@/lib/api/client'

const { currentAccount, navigate } = vi.hoisted(() => ({ currentAccount: vi.fn(), navigate: vi.fn() }))
vi.mock('@/lib/auth/client', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/auth/client')>(),
  currentAccount,
  useAccessNavigation: () => navigate,
}))

afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks()})
it('refreshes only its account after verification and removes its timer on unmount', async ()=>{
  vi.useFakeTimers()
  currentAccount.mockResolvedValue({username:'account-a'})
  const client=new QueryClient(),invalidate=vi.spyOn(client,'invalidateQueries').mockResolvedValue()
  const visibility=vi.spyOn(document,'visibilityState','get').mockReturnValue('visible')
  const view=render(<QueryClientProvider client={client}><PreferencesProvider preferences={{language:'en'}} messages={en}><AccountScope account="account-a">private</AccountScope></PreferencesProvider></QueryClientProvider>)
  await act(async () => {})
  act(()=>vi.advanceTimersByTime(60_000))
  expect(invalidate).toHaveBeenCalledExactlyOnceWith({queryKey:['finance','account-a']})
  visibility.mockReturnValue('hidden')
  act(()=>vi.advanceTimersByTime(60_000))
  expect(invalidate).toHaveBeenCalledOnce()
  visibility.mockReturnValue('visible')
  await act(async ()=>{document.dispatchEvent(new Event('visibilitychange'))})
  expect(invalidate).toHaveBeenCalledTimes(2)
  expect(invalidate).toHaveBeenLastCalledWith({queryKey:['finance','account-a'], refetchType:'none'})
  view.unmount();act(()=>vi.advanceTimersByTime(60_000))
  expect(invalidate).toHaveBeenCalledTimes(2)
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
    window.dispatchEvent(new Event('focus'))
    window.dispatchEvent(new Event('focus'))
  })
  expect(currentAccount).toHaveBeenCalledTimes(2)
  expect(field.closest('[inert]')).toBeInTheDocument()
  await act(async () => { pending.resolve({username:'account-a'}) })
  expect(field).toHaveValue('My draft')
  expect(field.closest('[inert]')).toBeNull()
  currentAccount.mockRejectedValueOnce(new ApiError(503))
  await act(async () => { window.dispatchEvent(new Event('focus')) })
  expect(field.closest('[inert]')).toBeInTheDocument()
  currentAccount.mockResolvedValueOnce({username:'account-b'})
  await act(async () => { fireEvent.click(screen.getByRole('button', {name:'Retry session check'})) })
  expect(field).not.toBeInTheDocument()
  expect(navigate).toHaveBeenCalledOnce()
})
