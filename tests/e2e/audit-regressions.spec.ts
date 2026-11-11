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

test('budget cards and chart use the same transactions', async ({ page }) => {
  await page.goto('/finance/budgets')
  const entertainment = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Entertainment', level: 2, exact: true }) })

  await expect(entertainment.getByText('$15.00', { exact: true })).toBeVisible()
  await expect(entertainment.getByText('$35.00', { exact: true })).toBeVisible()
  await expect(page.getByText('$270.50', { exact: true })).toBeVisible()
})

test('pot form controls have accessible labels', async ({ page }) => {
  await page.goto('/finance/pots')
  await page.getByRole('button', { name: '+ Add New Pot', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Pot Name', exact: true })).toBeVisible()
  await expect(page.getByRole('spinbutton', { name: 'Target', exact: true })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Theme', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Close', exact: true }).click()
})
