import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { chromium, expect } from '@playwright/test'

// Run against Next configured for Spring and an isolated disposable database.
const origin = process.env.FINANCE_SMOKE_ORIGIN ?? 'http://localhost:3200'
const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ baseURL: origin })
  const http = context.request
  const username = 'smoke-' + randomUUID()
  const password = '  ' + randomUUID() + '  '
  const csrf = await (await http.get('/api/auth/csrf')).json()
  const registered = await http.post('/api/auth/register', {
    headers: { Origin: origin, [csrf.headerName]: csrf.token },
    data: { username, password },
  })
  assert.equal(registered.status(), 201)
  assert.deepEqual(await registered.json(), { username })
  assert.equal((await http.get('/api/auth/me')).status(), 401)
  const previous = (await context.cookies()).find(c => c.name === 'JSESSIONID')
  assert.ok(previous)
  const page = await context.newPage()
  await page.goto('/login')
  await page.getByLabel('Username', { exact: true }).fill(username.toUpperCase())
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Login', exact: true }).click()
  await expect(page).toHaveURL(origin + '/finance', { timeout: 20_000 })
  const current = (await context.cookies()).find(c => c.name === 'JSESSIONID')
  assert.ok(current?.httpOnly)
  assert.equal(current.path, '/')
  assert.equal(current.sameSite, 'Lax')
  assert.notEqual(current.value, previous.value)
  assert.deepEqual(await (await http.get('/api/auth/me')).json(), { username })
  assert.ok(!(await page.evaluate(() => document.cookie)).includes('JSESSIONID'))
  assert.equal((await http.post('/api/auth/logout', { headers: { Origin: origin, [csrf.headerName]: csrf.token } })).status(), 403)
  const fresh = await (await http.get('/api/auth/csrf')).json()
  assert.notEqual(fresh.token, csrf.token)
  await page.getByRole('button', { name: 'Logout', exact: true }).click()
  await expect(page).toHaveURL(origin + '/login')
  assert.equal((await http.get('/api/auth/me')).status(), 401)
  assert.equal((await context.cookies()).find(c => c.name === 'JSESSIONID'), undefined)
  console.log('PASS: Spring registration, anonymous identity, browser login, HttpOnly cookie rotation, CSRF renewal, browser logout and session deletion.')
} finally {
  await browser.close()
}
