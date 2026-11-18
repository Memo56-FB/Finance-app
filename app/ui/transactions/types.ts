export type Transaction = {
  id: string
  name: string
  category: string
  date: Date
  amount: number
}

export type TransactionSort =
  | 'Latest'
  | 'Oldest'
  | 'A to Z'
  | 'Z to A'
  | 'Highest'
  | 'Lowest'

export type TransactionFilters = {
  query: string
  category: string
  sortBy: TransactionSort
}
