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

test('budget cards and chart use the same transactions', async ({ page }) => {
  await page.goto('/finance/budgets')
  const entertainment = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Entertainment', level: 2, exact: true }) })

  await expect(entertainment.getByText('$15.00', { exact: true })).toBeVisible()
  await expect(entertainment.getByText('$35.00', { exact: true })).toBeVisible()
  await expect(page.getByText('$270.50', { exact: true })).toBeVisible()
})
