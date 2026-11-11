import { expect, test } from '@playwright/test'

test('transactions navigation baseline', async ({ page }) => {
  await page.goto('/finance/transactions')

  await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible()
  await expect(page.getByRole('link', { name: '1' })).toHaveAttribute('aria-current', 'page')

  const table = page.locator('table')
  const search = page.getByPlaceholder('Search transaction')
  await expect(async () => {
    await search.fill('Emma')
    await expect(table.getByText('Emma Richardson')).toBeVisible()
    await expect(table.getByText('Bravo Zen Spa')).toHaveCount(0)
  }).toPass()
  await search.fill('')
  await expect(table.getByText('Bravo Zen Spa')).toBeVisible()

  await page.getByRole('link', { name: 'Go to next page' }).click()

  await expect(page.getByRole('link', { name: '2' })).toHaveAttribute('aria-current', 'page')
  await expect(page).toHaveURL(/page=2/)
  await expect(table.getByText('Sun Park')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('link', { name: '2', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(table.getByText('Sun Park')).toBeVisible()

  await page.goBack()
  await expect(page.getByRole('link', { name: '1', exact: true })).toHaveAttribute('aria-current', 'page')
})
