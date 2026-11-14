'use client'

import { isServer, QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false, networkMode: 'always', gcTime: 0 } } })
}
let browserClient: QueryClient | undefined
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const client = isServer ? makeQueryClient() : (browserClient ??= makeQueryClient())
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
