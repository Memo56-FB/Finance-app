import { describe, expect, it } from 'vitest'
import { budgets, totalBudget, totalSpent } from './data'

describe('budget spending', () => {
  it('uses category expenses and excludes income from spent money', () => {
    expect(budgets.map(({ title, spent }) => ({ title, spent }))).toEqual([
      { title: 'Entertainment', spent: 15 },
      { title: 'Bills', spent: 175 },
      { title: 'Dining Out', spent: 55.5 },
      { title: 'Personal Care', spent: 25 },
    ])
    expect(budgets[0].latest.map(({ recipient }) => recipient)).toEqual(['Oak and Ivy'])
    expect(totalBudget).toBe(975)
    expect(totalSpent).toBe(270.5)
  })
})
