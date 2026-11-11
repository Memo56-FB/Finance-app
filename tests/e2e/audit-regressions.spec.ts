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
