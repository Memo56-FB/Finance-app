import { FinanceEntry } from '@/lib/finance/server'
import type { PageProps } from '@/lib/auth/types'

export default function Page({ searchParams }: PageProps) {
  return <FinanceEntry path="/finance/pots" section="pots" searchParams={searchParams} />
}
