import { expect, test, type Page } from '@playwright/test'
import { baseURL, enterGuest } from './guest'
const apiURL = 'http://127.0.0.1:3101'
const routes = ['/finance','/finance/transactions','/finance/categories','/finance/budgets','/finance/pots','/finance/recurring-bills']
async function login(page: Page, username='first', password='test-password-123') {
  await page.goto('/login')
  await page.getByLabel('Username',{exact:true}).fill(username)
  await page.getByLabel('Password',{exact:true}).fill(password)
  await page.getByRole('button',{name:'Login',exact:true}).click()
}
test('all finance HTML and RSC entries reject anonymous access', async ({ request, page }) => {
  for (const route of routes) {
    for (const headers of [{} as Record<string,string>, { RSC:'1' }]) {
      const response = await request.get(route,{headers,maxRedirects:0})
      const body = await response.text()
      expect(body).not.toContain('Ticket refund')
      expect(body).not.toContain('$5,113.75')
      expect(response.status() === 307 || body.includes('/login?')).toBe(true)
    }
  }
  await page.goto('/finance/transactions?query=Ticket&page=2')
  await expect(page).toHaveURL(/\/login\?next=/)
  await page.getByRole('button',{name:'Continue as guest'}).click()
  await expect(page).toHaveURL(/\/finance\/transactions\?query=Ticket&page=2/)
  await expect(page.getByRole('button',{name:'Logout',exact:true})).toBeVisible()
})
test('registration confirms without login; real form login and logout rotate cookies', async ({ page, context }) => {
  const username = 'new-'+Date.now()+'-'+test.info().workerIndex
  await page.goto('/singup')
  await page.getByLabel('Name',{exact:true}).fill('María José')
  await page.getByLabel('Username',{exact:true}).fill(username)
  await page.getByLabel('Create Password',{exact:true}).fill('  test-password-123  ')
  await page.getByRole('button',{name:'Create Account',exact:true}).click()
  await expect(page.getByRole('status')).toContainText('Account created')
  expect((await context.request.get('/api/auth/me')).status()).toBe(401)
  const before = (await context.cookies()).find(c=>c.name==='JSESSIONID')!.value
  await page.getByRole('link',{name:'Login',exact:true}).first().click()
  await page.getByLabel('Username',{exact:true}).fill(username.toUpperCase())
  await page.getByLabel('Password',{exact:true}).fill('  test-password-123  ')
  await page.getByRole('button',{name:'Login',exact:true}).click()
  await expect(page).toHaveURL('/finance')
  const cookie = (await context.cookies()).find(c=>c.name==='JSESSIONID')!
  expect(cookie.value).not.toBe(before);expect(cookie.httpOnly).toBe(true);expect(cookie.path).toBe('/')
  expect(await page.evaluate(()=>document.cookie)).not.toContain('JSESSIONID')
  await expect(page.getByRole('button',{name:'Logout',exact:true})).toHaveAttribute('title','Logout')
  await expect(page.locator('body')).not.toContainText('Demo data · Changes are not saved')
  await page.getByRole('button',{name:'Logout',exact:true}).click()
  await expect(page).toHaveURL('/login')
  expect((await context.request.get('/api/auth/me')).status()).toBe(401)
  await page.goBack()
  await page.goto('/finance')
  await expect(page).toHaveURL(/\/login/)
})
test('invalid login is local, duplicate registration is a field error, and pending submits are single', async ({ page }) => {
  await login(page,'first','wrong-password')
  await expect(page.locator('p[role="alert"]')).toContainText('Invalid username or password.')
  await expect(page).toHaveURL('/login')
  await page.goto('/singup')
  await page.getByLabel('Name',{exact:true}).fill('Example')
  await page.getByLabel('Username',{exact:true}).fill('first')
  await page.getByLabel('Create Password',{exact:true}).fill('test-password-123')
  let submissions = 0
  await page.route('**/api/auth/register',async route=> { submissions++;await new Promise(resolve=>setTimeout(resolve,200));await route.continue() })
  await page.getByRole('button',{name:'Create Account',exact:true}).click()
  await expect(page.getByRole('button',{name:'Please wait…',exact:true})).toBeDisabled()
  await expect(page.locator('p[role="alert"]')).toContainText('already registered')
  await expect(page.getByLabel('Username',{exact:true})).toHaveAttribute('aria-invalid','true')
  expect(submissions).toBe(1)
  expect(page.url()).not.toContain('password')
})
test('guest survives reload and never returns account identity', async ({ page,context }) => {
  await page.goto('/login')
  await page.getByRole('button',{name:'Continue as guest'}).click()
  await expect(page).toHaveURL('/finance')
  for (const route of routes) { await page.goto(route); await expect(page.getByRole('button',{name:'Logout',exact:true})).toBeVisible() }
  await page.reload()
  expect((await context.request.get('/api/auth/me')).status()).toBe(401)
  await page.getByRole('button',{name:'Logout',exact:true}).click()
  await expect(page).toHaveURL('/login')
  await page.goto('/finance/pots');await expect(page).toHaveURL(/\/login/)
})
test('expired and fake sessions are rejected; infrastructure failure does not grant guest access', async ({ page: loginPage,context }) => {
  await login(loginPage)
  await expect(loginPage).toHaveURL('/finance')
  const cookie=(await context.cookies()).find(c=>c.name==='JSESSIONID')!
  await loginPage.close()
  await context.request.post(apiURL+'/__expire',{headers:{Cookie:'JSESSIONID='+cookie.value}})
  const page = await context.newPage()
  await page.goto('/finance/budgets')
  await expect(page).toHaveURL(/\/login/)
  await context.addCookies([{name:'JSESSIONID',value:'unavailable',url:baseURL}])
  await page.goto('/finance/pots')
  await expect(page).toHaveURL(/reason=unavailable/)
  await expect(page.locator('p[role="alert"]')).toContainText('unavailable')
  expect((await context.cookies()).find(c=>c.name==='finance-guest')).toBeUndefined()
  await page.getByRole('button',{name:'Continue as guest'}).click()
  await expect(page).toHaveURL('/finance/pots')
})
test('guest to account transition and two independent users retain isolated identity and language', async ({ browser }) => {
  const contexts = await Promise.all([browser.newContext(),browser.newContext()])
  try {
    for (const [i,context] of contexts.entries()) {
      await enterGuest(context)
      await context.addCookies([{name:'finance-language',value:i===0?'en':'es',url:baseURL}])
      const csrf = await (await context.request.get(baseURL+'/api/auth/csrf')).json()
      expect((await context.request.post(baseURL+'/api/auth/login',{headers:{Origin:baseURL,[csrf.headerName]:csrf.token},form:{username:i===0?'first':'second',password:'test-password-123'}})).status()).toBe(204)
      expect((await context.cookies()).find(c=>c.name==='finance-guest')).toBeUndefined()
    }
    const [a,b]=await Promise.all(contexts.map(async c => (await c.request.get(baseURL+'/api/auth/me')).json()))
    expect(a.username).toBe('first');expect(b.username).toBe('second')
    for (const [i,c] of contexts.entries()) {
      const page=await c.newPage();await page.goto(baseURL+'/finance')
      await expect(page.locator('html')).toHaveAttribute('lang',i===0?'en':'es')
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex, nofollow')
    }
  } finally { await Promise.all(contexts.map(c=>c.close())) }
})
test.describe('without JavaScript', () => {
test.use({ javaScriptEnabled: false })
test('mutations reject cross-origin and missing CSRF; public HTML remains available without scripts', async ({ request,page }) => {
  expect((await request.post('/api/auth/guest',{headers:{Origin:'https://evil.test'}})).status()).toBe(403)
  expect((await request.post('/api/auth/register',{headers:{Origin:baseURL},data:{name:'a',username:'sample',password:'secret'}})).status()).toBe(403)
  await page.goto(baseURL+'/login')
  await expect(page.getByRole('heading',{name:'Login',exact:true})).toBeVisible()
  expect(await page.locator('noscript').textContent()).toBe('Enable JavaScript to use these forms.')
  await expect(page.locator('noscript')).toBeVisible()
  await expect(page.getByRole('button',{name:'Login',exact:true})).toBeDisabled()
})
})
test('hostile return URL falls back to finance and retains Spanish on exit', async ({ page,context }) => {
  await context.addCookies([{name:'finance-language',value:'es',url:baseURL}])
  await page.goto('/login?next='+encodeURIComponent('//evil.test'))
  await page.getByRole('button',{name:'Continuar como invitado'}).click()
  await expect(page).toHaveURL('/finance')
  await page.getByRole('button',{name:'Cerrar sesión'}).click()
  await expect(page.locator('html')).toHaveAttribute('lang','es')
})

test('login confirmation retry never resends credentials and logout failure is recoverable', async ({ page,context }) => {
  let logins=0, identityFailures=1
  await page.route('**/api/auth/login',async route=>{logins++;await route.continue()})
  await page.route('**/api/auth/me',async route=>{
    if (identityFailures-- > 0) await route.fulfill({status:503})
    else await route.continue()
  })
  await login(page)
  await expect(page.locator('p[role="alert"]')).toContainText('unavailable')
  await page.getByRole('button',{name:'Retry session check',exact:true}).click()
  await expect(page).toHaveURL('/finance')
  expect(logins).toBe(1)
  await page.route('**/api/auth/logout',route=>route.fulfill({status:503}))
  await expect(page.getByRole('heading',{name:'Overview',exact:true})).toBeVisible()
  await expect(page.getByRole('button',{name:'Logout',exact:true})).toBeEnabled()
  const mainBefore=(await page.locator('main').boundingBox())!
  await page.getByRole('button',{name:'Logout',exact:true}).click()
  await expect(page.getByRole('alert').filter({hasText:'Could not sign out'})).toBeVisible()
  expect((await page.locator('main').boundingBox())!.y).toBe(mainBefore.y)
  await expect(page).toHaveURL('/finance')
  expect((await context.request.get('/api/auth/me')).status()).toBe(200)
  await page.unroute('**/api/auth/logout')
  await page.getByRole('button',{name:'Logout',exact:true}).click()
  await expect(page).toHaveURL('/login')
})

test('an expired login confirmation offers a fresh explicit login', async ({ page }) => {
  let logins = 0, checks = 0
  await page.route('**/api/auth/login', route => { logins++; return route.continue() })
  await page.route('**/api/auth/me', route => {
    checks++
    return checks === 1 ? route.fulfill({status:401}) : route.continue()
  })
  await login(page)
  await expect(page.locator('form').getByRole('alert')).toContainText('Your session expired.')
  await expect(page.getByRole('button', {name:'Login', exact:true})).toBeEnabled()
  expect(logins).toBe(1)
  expect(checks).toBe(1)
  await page.locator('input[name="password"]').fill('test-password-123')
  await page.getByRole('button', {name:'Login', exact:true}).click()
  await expect(page).toHaveURL('/finance')
  expect(logins).toBe(2)
})

test('guest tabs follow confirmed sign-in and sign-out in the same browser', async ({ page, context }) => {
  await page.goto('/login')
  await page.getByRole('button',{name:'Continue as guest'}).click()
  await expect(page).toHaveURL('/finance')
  const other = await context.newPage()
  await other.goto('/finance/categories')
  await expect(other.getByText('Log in to save changes.',{exact:true})).toBeVisible()
  await login(page)
  await expect(page).toHaveURL('/finance')
  await expect(other.getByRole('button',{name:'+ Add category', exact:true})).toBeEnabled()
  await expect(other.getByText('No categories yet.', {exact:true})).toBeVisible()
  await page.getByRole('button',{name:'Logout',exact:true}).click()
  await expect(page).toHaveURL('/login')
  await expect(other).toHaveURL(/\/login\?next=/)
})
