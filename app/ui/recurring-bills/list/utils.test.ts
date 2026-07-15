import { describe, expect, it } from 'vitest'
import { recurringBills } from './data'
import type { RecurringBill } from './types'
import { calculateRecurringBillsSummary, filterBillsByTitle, sortBills } from './utils'

const bills: RecurringBill[] = [
  {
    title: 'Zeta Internet',
    dueDate: 'Monthly-20th',
    dueDay: 20,
    amount: 80,
    status: 'due',
    icon: {} as RecurringBill['icon'],
    iconClassName: 'bg-blue',
  },
  {
    title: 'Alpha Mobile',
    dueDate: 'Monthly-5th',
    dueDay: 5,
    amount: 120,
    status: 'paid',
    icon: {} as RecurringBill['icon'],
    iconClassName: 'bg-green',
  },
  {
    title: 'Mango Streaming',
    dueDate: 'Monthly-12th',
    dueDay: 12,
    amount: 15,
    status: 'paid',
    icon: {} as RecurringBill['icon'],
    iconClassName: 'bg-purple',
  },
]

describe('sortBills', () => {
  it('sorts due days for Latest and Oldest', () => {
    expect(sortBills(bills, 'Latest').map((bill) => bill.dueDay)).toEqual([5, 12, 20])
    expect(sortBills(bills, 'Oldest').map((bill) => bill.dueDay)).toEqual([20, 12, 5])
  })

  it('sorts titles in both alphabetical directions', () => {
    expect(sortBills(bills, 'A to Z').map((bill) => bill.title)).toEqual([
      'Alpha Mobile',
      'Mango Streaming',
      'Zeta Internet',
    ])
    expect(sortBills(bills, 'Z to A').map((bill) => bill.title)).toEqual([
      'Zeta Internet',
      'Mango Streaming',
      'Alpha Mobile',
    ])
  })

  it('sorts amounts without mutating the input array', () => {
    const originalOrder = bills.map((bill) => bill.title)

    expect(sortBills(bills, 'Highest').map((bill) => bill.amount)).toEqual([120, 80, 15])
    expect(sortBills(bills, 'Lowest').map((bill) => bill.amount)).toEqual([15, 80, 120])
    expect(bills.map((bill) => bill.title)).toEqual(originalOrder)
  })

  it('uses the Latest ordering for an unknown label', () => {
    expect(sortBills(bills, 'Unknown').map((bill) => bill.dueDay)).toEqual([5, 12, 20])
  })
})

describe('filterBillsByTitle', () => {
  it('trims whitespace, ignores case, and matches substrings', () => {
    expect(filterBillsByTitle(bills, '  STREAM  ').map((bill) => bill.title)).toEqual([
      'Mango Streaming',
    ])
    expect(bills.map((bill) => bill.title)).toEqual([
      'Zeta Internet',
      'Alpha Mobile',
      'Mango Streaming',
    ])
  })

  it('returns all bills for an empty or whitespace-only query', () => {
    expect(filterBillsByTitle(bills, '')).toBe(bills)
    expect(filterBillsByTitle(bills, '   ')).toBe(bills)
  })
})

describe('calculateRecurringBillsSummary', () => {
  it('calculates the current recurring-bill fixture', () => {
    expect(calculateRecurringBillsSummary(recurringBills)).toEqual({
      total: { amount: 1550, count: 8 },
      paid: { amount: 1510, count: 6 },
      upcoming: { amount: 40, count: 2 },
      dueSoon: { amount: 40, count: 2 },
    })
  })

  it('handles empty input', () => {
    expect(calculateRecurringBillsSummary([])).toEqual({
      total: { amount: 0, count: 0 },
      paid: { amount: 0, count: 0 },
      upcoming: { amount: 0, count: 0 },
      dueSoon: { amount: 0, count: 0 },
    })
  })

  it('handles all-paid and all-due input', () => {
    expect(calculateRecurringBillsSummary(bills.filter((bill) => bill.status === 'paid'))).toMatchObject({
      total: { amount: 135, count: 2 },
      paid: { amount: 135, count: 2 },
      upcoming: { amount: 0, count: 0 },
      dueSoon: { amount: 0, count: 0 },
    })
    expect(calculateRecurringBillsSummary(bills.filter((bill) => bill.status === 'due'))).toMatchObject({
      total: { amount: 80, count: 1 },
      paid: { amount: 0, count: 0 },
      upcoming: { amount: 80, count: 1 },
      dueSoon: { amount: 80, count: 1 },
    })
  })

  it('handles mixed statuses and zero amounts', () => {
    const mixedBills = [
      { ...bills[0], amount: 0 },
      { ...bills[1], amount: 25 },
      { ...bills[0], amount: 10 },
    ]

    expect(calculateRecurringBillsSummary(mixedBills)).toEqual({
      total: { amount: 35, count: 3 },
      paid: { amount: 25, count: 1 },
      upcoming: { amount: 10, count: 2 },
      dueSoon: { amount: 10, count: 2 },
    })
  })
})
