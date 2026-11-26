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

it('keeps independent local budget operations scoped to the session and rejects a duplicate reservation', async () => {
  const { SaveOperations, useBudgetView, useSaveOperation } = await import('@/app/ui/finance/common')
  const first = Promise.withResolvers<never>()
  const second = Promise.withResolvers<never>()
  const attempts = vi.fn()
  currentAccount.mockReset().mockImplementation(async () => ({ username: 'account-a' }))

  function Editor() {
    const submit = useSaveOperation()
    const budgets = useBudgetView({ items: [] })
    function add(categoryId: string) {
      const request = categoryId === '1' ? first : second
      submit({
        resource: 'budgets', label: 'Add Budget',
        intent: { resource: 'budgets', action: 'save', value: {
          categoryId, categoryName: 'Budget ' + categoryId, spendingLimit: '25', color: '#ffffff',
        } },
      }, () => { attempts(categoryId); return request.promise })
    }
    return <>
      <button onClick={() => add('1')}>First budget</button>
      <button onClick={() => add('2')}>Second budget</button>
      <button>Cancel draft</button>
      {budgets?.map(budget => <span key={budget.id}>{budget.id} {budget.categoryName}</span>)}
    </>
  }

  const client = new QueryClient()
  const { rerender } = render(<QueryClientProvider client={client}><PreferencesProvider preferences={{language:'en'}} messages={en}>
    <AccountScope key="account-a" account="account-a"><SaveOperations><Editor/></SaveOperations></AccountScope>
  </PreferencesProvider></QueryClientProvider>)
  await act(async () => {})
  fireEvent.click(screen.getByText('Cancel draft'))
  expect(attempts).not.toHaveBeenCalled()
  await act(async () => {
    fireEvent.click(screen.getByText('First budget'))
    fireEvent.click(screen.getByText('First budget'))
    fireEvent.click(screen.getByText('Second budget'))
  })
  expect(attempts.mock.calls).toEqual([['1'], ['2']])
  expect(screen.getByText('local:1 Budget 1')).toBeInTheDocument()
  expect(screen.getByText('local:2 Budget 2')).toBeInTheDocument()
  await act(async () => { first.reject(new ApiError(409)) })
  expect(screen.queryByText('local:1 Budget 1')).toBeNull()
  expect(screen.getByText('local:2 Budget 2')).toBeInTheDocument()

  currentAccount.mockResolvedValue({ username: 'account-b' })
  rerender(<QueryClientProvider client={client}><PreferencesProvider preferences={{language:'en'}} messages={en}>
    <AccountScope key="account-b" account="account-b"><SaveOperations><Editor/></SaveOperations></AccountScope>
  </PreferencesProvider></QueryClientProvider>)
  await act(async () => { second.reject(new ApiError(409)) })
  expect(screen.queryByText('local:2 Budget 2')).toBeNull()
  expect(screen.queryByText(/conflicts with the saved data/)).toBeNull()
})
