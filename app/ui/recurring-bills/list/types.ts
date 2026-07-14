import type { Icon } from '@phosphor-icons/react'

export type RecurringBill = {
  title: string
  dueDate: string
  dueDay: number
  amount: number
  status: 'paid' | 'due'
  icon: Icon
  iconClassName: string
}
