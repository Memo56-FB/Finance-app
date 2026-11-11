import { expect, test } from '@playwright/test'

test('account forms keep credentials out of the URL', async ({ page }) => {
  for (const route of ['login', 'singup']) {
    await page.goto(`/${route}`)
    await page.getByLabel('Email', { exact: true }).fill('audit@example.invalid')
    const password = page.locator('input[name="password"]')
    await password.fill('audit-dummy-password')

    await expect(page.locator('form')).toHaveAttribute('method', 'post')
    await expect(page.getByRole('button', { name: route === 'login' ? 'Login' : 'Create Account', exact: true })).toBeDisabled()
    await password.press('Enter')
    await expect(page).toHaveURL(new RegExp(`/${route}$`))
  }
})

test('mobile navigation and filters have accessible names', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/finance/transactions')

  for (const name of ['Overview', 'Transactions', 'Budgets', 'Pots', 'Recurring bills']) {
    await expect(page.getByRole('link', { name, exact: true })).toBeVisible()
  }
  await expect(page.getByRole('button', { name: 'Sort By', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Category', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Bills', exact: true }).click()
  await expect(page.getByRole('article').filter({ hasText: 'Connect Care' })).toBeVisible()
})

test('overview links include their arrow in the clickable area', async ({ page }) => {
  await page.goto('/finance')
  for (const route of ['pots', 'transactions', 'budgets', 'recurring-bills']) {
    await expect(page.locator(`a[href="/finance/${route}"]`).filter({ hasText: 'See Details' })).toHaveCount(1)
  }
  await page.locator('a[href="/finance/pots"]').filter({ hasText: 'See Details' }).locator('svg').click()
  await expect(page.getByRole('heading', { name: 'Pots', exact: true })).toBeVisible()
})

test('budget cards and chart use the same transactions', async ({ page }) => {
  await page.goto('/finance/budgets')
  const entertainment = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Entertainment', level: 2, exact: true }) })

  await expect(entertainment.getByText('$15.00', { exact: true })).toBeVisible()
  await expect(entertainment.getByText('$35.00', { exact: true })).toBeVisible()
  await expect(page.getByText('$270.50', { exact: true })).toBeVisible()
  await entertainment.getByRole('link', { name: 'See All', exact: true }).click()
  await expect(page.getByRole('combobox', { name: 'Category', exact: true })).toContainText('Entertainment')
  await expect(page.locator('table').getByText('Oak and Ivy', { exact: true })).toBeVisible()
})

test('transaction URLs validate page bounds and preserve search text', async ({ page }) => {
  for (const [value, expectedPage] of [['-1', '1'], ['invalid', '1'], ['1.5', '1'], ['999', '3']]) {
    await page.goto(`/finance/transactions?page=${value}`)
    await expect(page.getByRole('link', { name: expectedPage, exact: true })).toHaveAttribute('aria-current', 'page')
  }

  const search = page.getByRole('textbox', { name: 'Search transactions', exact: true })
  await search.pressSequentially('Savory')
  await expect(search).toHaveValue('Savory')
  await expect(page.locator('table').getByText('Bravo Zen Spa')).toHaveCount(0)
  await expect(page.getByRole('link', { name: '1', exact: true })).toHaveAttribute('aria-current', 'page')
  await page.reload()
  await expect(search).toHaveValue('Savory')
  await expect(page.locator('table').getByText('Savory Bites Bistro')).toBeVisible()

  await page.getByRole('link', { name: 'Transactions', exact: true }).click()
  await expect(search).toHaveValue('')
  await page.goBack()
  await expect(search).toHaveValue('Savory')
})

test('pot fields are labelled and their preview cannot confirm unsaved money', async ({ page }) => {
  await page.goto('/finance/pots')
  await page.getByRole('button', { name: '+ Add New Pot', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Pot Name', exact: true })).toBeVisible()
  await expect(page.getByRole('spinbutton', { name: 'Target', exact: true })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Theme', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add Pot', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Close', exact: true }).click()

  await page.getByRole('button', { name: '+Add Money', exact: true }).first().click()
  await page.getByRole('spinbutton', { name: 'Amount to Add', exact: true }).fill('10.50')
  await expect(page.getByRole('dialog').getByText('$169.50', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirm Addition', exact: true })).toBeDisabled()
})
