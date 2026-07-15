'use client'
import {
  ClockClockwise,
  ForkKnife,
  GraduationCap,
  Lightning,
  PaperPlaneTilt,
  Percent,
  Taxi,
  WaveSine,
} from '@phosphor-icons/react'
import type { RecurringBill } from './types'

export const sortOptions = ['Latest', 'Oldest', 'A to Z', 'Z to A', 'Highest', 'Lowest']

export const recurringBills: RecurringBill[] = [
  {
    title: 'Elevate Education',
    dueDate: 'Monthly-1st',
    dueDay: 1,
    amount: 250,
    status: 'paid',
    icon: GraduationCap,
    iconClassName: 'bg-green',
  },
  {
    title: 'Bravo Zen Spa',
    dueDate: 'Monthly-3rd',
    dueDay: 3,
    amount: 70,
    status: 'paid',
    icon: Percent,
    iconClassName: 'bg-yellow',
  },
  {
    title: 'Charlie Electric Company',
    dueDate: 'Monthly-5th',
    dueDay: 5,
    amount: 10,
    status: 'due',
    icon: Lightning,
    iconClassName: 'bg-red',
  },
  {
    title: 'Delta Taxi',
    dueDate: 'Monthly-6th',
    dueDay: 6,
    amount: 30,
    status: 'due',
    icon: Taxi,
    iconClassName: 'bg-cyan',
  },
  {
    title: 'Echo Game Store',
    dueDate: 'Monthly-12th',
    dueDay: 12,
    amount: 5,
    status: 'paid',
    icon: PaperPlaneTilt,
    iconClassName: 'bg-purple',
  },
  {
    title: 'Echo Game Store',
    dueDate: 'Monthly-16th',
    dueDay: 16,
    amount: 10,
    status: 'paid',
    icon: ClockClockwise,
    iconClassName: 'bg-navy',
  },
  {
    title: 'Tango Gas Company',
    dueDate: 'Monthly-22nd',
    dueDay: 22,
    amount: 225,
    status: 'paid',
    icon: WaveSine,
    iconClassName: 'bg-turquoise',
  },
  {
    title: 'Juliet Restaurant',
    dueDate: 'Monthly-28th',
    dueDay: 28,
    amount: 950,
    status: 'paid',
    icon: ForkKnife,
    iconClassName: 'bg-brown',
  },
]
