import { enterGuest } from './guest'
import { expect, test } from '@playwright/test'

test.beforeEach(async ({ context }) => { await enterGuest(context) })

test('transactions navigation baseline', async ({ page }) => {
  await page.goto('/finance/transactions')

  await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible()
  await expect(page.getByRole('link', { name: '1' })).toHaveAttribute('aria-current', 'page')

  const table = page.locator('table')
  await expect(table.getByRole('columnheader', { name: 'Name', exact: true })).toBeVisible()
  await expect(table.locator('img')).toHaveCount(0)
  const search = page.getByPlaceholder('Search transaction')
  await expect(async () => {
    await search.fill('Ticket')
    await expect(table.getByText('Ticket refund')).toBeVisible()
    await expect(table.getByText('Spa appointment')).toHaveCount(0)
  }).toPass()
  await search.fill('')
  await expect(table.getByText('Spa appointment')).toBeVisible()

  await page.getByRole('link', { name: 'Go to next page' }).click()

  await expect(page.getByRole('link', { name: '2' })).toHaveAttribute('aria-current', 'page')
  await expect(page).toHaveURL(/page=2/)
  await expect(table.getByText('Grocery refund')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('link', { name: '2', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(table.getByText('Grocery refund')).toBeVisible()

  await page.goBack()
  await expect(page.getByRole('link', { name: '1', exact: true })).toHaveAttribute('aria-current', 'page')
})

test('guest switches among all sections with the API unavailable', async ({page}) => {
  await page.goto('/finance')
  await expect(page.getByRole('button', {name:'Logout'})).toBeEnabled()
  let reads = 0
  await page.route(/\/api\/(auth\/me|finance\/)/, route => { reads++; return route.abort() })
  for (const section of ['Transactions', 'Categories', 'Budgets', 'Pots', 'Recurring bills', 'Overview']) {
    const link = page.getByRole('link', {name:section, exact:true})
    await link.click()
    await expect(link).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('heading', {name:section === 'Recurring bills' ? 'Recurring Bills' : section, exact:true})).toBeFocused()
  }
  expect(reads).toBe(0)
})
