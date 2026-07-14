import { describe, expect, it } from 'vitest'
import { filterTransactions, getPageCount, paginateTransactions, sortTransactions } from './utils'
import type { Transaction } from './types'

const sampleTransactions: Transaction[] = [
  { id: 'z', recipient: 'Zed', category: 'Bills', date: new Date('2024-08-20'), amount: -120, avatarPath: '/z.jpg' },
  { id: 'a', recipient: 'Alice', category: 'Groceries', date: new Date('2024-08-22'), amount: 75, avatarPath: '/a.jpg' },
  { id: 'm', recipient: 'Mia', category: 'Bills', date: new Date('2024-08-21'), amount: -25, avatarPath: '/m.jpg' },
  { id: 'b', recipient: 'Bob', category: 'Groceries', date: new Date('2024-08-23'), amount: 150, avatarPath: '/b.jpg' },
]

describe('sortTransactions', () => {
  it('sorts all six options and uses signed numeric amounts', () => {
    expect(sortTransactions(sampleTransactions, 'Latest').map(({ id }) => id)).toEqual(['b', 'a', 'm', 'z'])
    expect(sortTransactions(sampleTransactions, 'Oldest').map(({ id }) => id)).toEqual(['z', 'm', 'a', 'b'])
    expect(sortTransactions(sampleTransactions, 'A to Z').map(({ id }) => id)).toEqual(['a', 'b', 'm', 'z'])
    expect(sortTransactions(sampleTransactions, 'Z to A').map(({ id }) => id)).toEqual(['z', 'm', 'b', 'a'])
    expect(sortTransactions(sampleTransactions, 'Highest').map(({ amount }) => amount)).toEqual([150, 75, -25, -120])
    expect(sortTransactions(sampleTransactions, 'Lowest').map(({ amount }) => amount)).toEqual([-120, -25, 75, 150])
  })

  it('does not mutate the source array and uses ids as a tie-breaker', () => {
    const tied = [
      { ...sampleTransactions[0], id: 'b' },
      { ...sampleTransactions[0], id: 'a' },
    ]

    expect(sortTransactions(tied, 'Highest').map(({ id }) => id)).toEqual(['a', 'b'])
    expect(tied.map(({ id }) => id)).toEqual(['b', 'a'])
  })
})

describe('filterTransactions', () => {
  it('matches recipient substrings case-insensitively', () => {
    expect(filterTransactions(sampleTransactions, '  ALI  ', 'All Transactions').map(({ id }) => id)).toEqual(['a'])
  })

  it('returns all categories for All Transactions and filters a category', () => {
    expect(filterTransactions(sampleTransactions, '', 'All Transactions')).toHaveLength(4)
    expect(filterTransactions(sampleTransactions, '', 'Bills').map(({ id }) => id)).toEqual(['z', 'm'])
  })
})

describe('paginateTransactions', () => {
  it('slices pages and clamps both boundaries', () => {
    expect(getPageCount(sampleTransactions, 2)).toBe(2)
    expect(paginateTransactions(sampleTransactions, 1, 2).map(({ id }) => id)).toEqual(['z', 'a'])
    expect(paginateTransactions(sampleTransactions, 2, 2).map(({ id }) => id)).toEqual(['m', 'b'])
    expect(paginateTransactions(sampleTransactions, 0, 2).map(({ id }) => id)).toEqual(['z', 'a'])
    expect(paginateTransactions(sampleTransactions, 3, 2).map(({ id }) => id)).toEqual(['m', 'b'])
  })
})
