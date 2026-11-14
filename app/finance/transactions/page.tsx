import TransactionsPage from '@/app/ui/transactions/TransactionsPage'
import { requireAccess } from '@/lib/auth/server'
import type { PageProps } from '@/lib/auth/types'
export default async function Page({ searchParams }: PageProps) {
  await requireAccess('/finance/transactions', await searchParams)
  return <TransactionsPage />
}
