import { FinanceHydration } from '@/lib/finance/server'
import { Transactions as LiveTransactions } from '@/app/ui/finance/Transactions'
import TransactionsPage from '@/app/ui/transactions/TransactionsPage'
import { requireAccess } from '@/lib/auth/server'
import type { PageProps } from '@/lib/auth/types'
export default async function Page({ searchParams }: PageProps) {
  const params=await searchParams
  const access=await requireAccess('/finance/transactions', params)
  if(access.kind === 'account') return <FinanceHydration account={access.email} section="transactions" params={params}><LiveTransactions/></FinanceHydration>
  return <TransactionsPage />
}
