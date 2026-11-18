// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PreferencesProvider } from '@/lib/i18n/client'
import { en } from '@/lib/i18n'
import { AccountScope } from './AccountScope'

afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks()})
it('refreshes only its account while visible and removes its timer on unmount',()=>{
  vi.useFakeTimers()
  const client=new QueryClient(),invalidate=vi.spyOn(client,'invalidateQueries').mockResolvedValue()
  const visibility=vi.spyOn(document,'visibilityState','get').mockReturnValue('visible')
  const view=render(<QueryClientProvider client={client}><PreferencesProvider preferences={{language:'en'}} messages={en}><AccountScope account="account-a">private</AccountScope></PreferencesProvider></QueryClientProvider>)
  act(()=>vi.advanceTimersByTime(60_000))
  expect(invalidate).toHaveBeenCalledExactlyOnceWith({queryKey:['finance','account-a']})
  visibility.mockReturnValue('hidden')
  act(()=>vi.advanceTimersByTime(60_000))
  expect(invalidate).toHaveBeenCalledOnce()
  visibility.mockReturnValue('visible')
  act(()=>document.dispatchEvent(new Event('visibilitychange')))
  expect(invalidate).toHaveBeenCalledTimes(2)
  view.unmount();act(()=>vi.advanceTimersByTime(60_000))
  expect(invalidate).toHaveBeenCalledTimes(2)
})
