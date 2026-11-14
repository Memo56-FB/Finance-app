import type { BrowserContext } from '@playwright/test'
export const baseURL = 'http://localhost:3100'
export async function enterGuest(context: BrowserContext) {
  const response = await context.request.post(baseURL + '/api/auth/guest', { headers: { Origin: baseURL } })
  if (response.status() !== 204) throw new Error('Could not prepare guest access')
}
