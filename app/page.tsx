import { redirect } from 'next/navigation'
import { getAccess } from '@/lib/auth/server'
export default async function Home() {
  const access = await getAccess()
  redirect(access.kind === 'guest' || access.kind === 'account' ? '/finance' : '/login')
}
