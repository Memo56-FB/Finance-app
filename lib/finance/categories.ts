import type { Category } from './types'

export function categoryOptions(categories: Category[]) {
  const counts = new Map<string, number>()
  categories.forEach(item => counts.set(item.name, (counts.get(item.name) ?? 0) + 1))
  return categories.map(item => ({ value: item.id, label: counts.get(item.name)! > 1 ? `${item.name} (#${item.id})` : item.name }))
}
