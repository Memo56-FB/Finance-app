'use client'
import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { createI18n, type Messages } from './index'
import type { Preferences } from './preferences'
import type { MoneyValue } from '@/lib/finance/money'
const Context = createContext<ReturnType<typeof createI18n> | null>(null)
export function PreferencesProvider({ preferences, messages, children }: { preferences: Preferences; messages: Messages; children: ReactNode }) {
  const value = useMemo(() => createI18n(preferences, messages), [preferences, messages])
  return <Context.Provider value={value}>{children}</Context.Provider>
}
export function useI18n() {
  const value = useContext(Context)
  if (!value) throw new Error('PreferencesProvider is required')
  return value
}
export function Text({ id }: { id: keyof Messages }) { return useI18n().t(id) }
export function Money({ value, signed = false }: { value: MoneyValue; signed?: boolean }) {
  const f = useI18n()
  return signed ? f.signed(value) : f.money(value)
}
export function CalendarDate({ value }: { value: string | Date }) { return useI18n().date(value) }
export function Percentage({ value }: { value: number }) { return useI18n().percent(value) }
// Only application-owned labels belong here; user content is rendered directly.
export function ControlledLabel({ value }: { value: string }) {
  const { messages } = useI18n()
  return Object.hasOwn(messages, value) ? messages[value as keyof Messages] : value
}
export function CurrencySymbol() { return useI18n().symbol }
