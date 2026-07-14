import { describe, expect, it } from 'vitest'
import type { RecurringBill } from './types'
import { filterBillsByTitle, sortBills } from './utils'

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
