export type Transaction = {
  id: string
  recipient: string
  category: string
  date: Date
  amount: number
  avatarPath: string
}

export type TransactionSort =
  | 'Latest'
  | 'Oldest'
  | 'A to Z'
  | 'Z to A'
  | 'Highest'
  | 'Lowest'
