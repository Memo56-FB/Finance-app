import { requireAccess } from '@/lib/auth/server'
import type { PageProps } from '@/lib/auth/types'
import { FinanceHydration } from '@/lib/finance/server'
import { Categories, GuestCategories } from '@/app/ui/finance/Categories'

export default async function Page({searchParams}:PageProps) {
  const params=await searchParams,access=await requireAccess('/finance/categories',params)
  return access.kind === 'account' ? <FinanceHydration account={access.email} section="categories" params={params}><Categories/></FinanceHydration> : <GuestCategories/>
}
