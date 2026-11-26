import { enterGuest } from './guest'
import { test, expect } from '@playwright/test'

test.beforeEach(async ({ context }) => { await enterGuest(context) })
const routes = ['/finance','/finance/transactions','/finance/categories','/finance/budgets','/finance/pots','/finance/recurring-bills','/login','/singup']
async function select(page: import('@playwright/test').Page, id: string, option: string) {
  await page.locator(`#preference-${id}`).click()
  await page.getByRole('option', { name: option, exact: true }).click()
  await expect(page.locator(`#preference-${id}`)).toContainText(option)
}
test('preferences persist, preserve canonical filters and work on mobile', async ({ page, context }) => {
  const errors: string[]=[]
  page.on('pageerror',error=>errors.push(error.message))
  page.on('console',message=>{if(message.type()==='error' && /hydration|hydrated|server rendered HTML/i.test(message.text()))errors.push(message.text())})
  const rateRequests: string[]=[]
  page.on('request',request=>{if(/forex|exchange-rate|exchangerate/i.test(request.url()))rateRequests.push(request.url())})
  await page.goto('/finance/transactions?category=Bills&sortBy=Highest&page=1')
  await select(page, 'language', 'Español')
  await expect(page.locator('html')).toHaveAttribute('lang','es')
  await expect(page.getByRole('combobox',{ name:'Categoría', exact:true })).toContainText('Pagos')
  await expect(page.getByRole('combobox',{ name:'Ordenar por', exact:true })).toContainText('Mayor importe')
  await expect(page).toHaveURL(/category=Bills&sortBy=Highest&page=1/)
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang','es')
  const tab = await context.newPage()
  await tab.goto('/finance')
  await expect(tab.locator('#preference-language')).toContainText('Español')
  await tab.close()
  await page.setViewportSize({width:390,height:844})
  await expect(page.getByRole('link',{name:'Pagos recurrentes',exact:true})).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('button',{name:'Categoría',exact:true}).click()
  await page.getByRole('menuitemradio',{name:'Entretenimiento',exact:true}).click()
  await expect(page).toHaveURL(/category=Entertainment/)
  await page.getByRole('button',{name:'Ordenar por',exact:true}).click()
  await page.getByRole('menuitemradio',{name:'Mayor importe',exact:true}).click()
  await page.getByRole('button',{name:'Ordenar por',exact:true}).press('Enter')
  await expect(page.getByRole('menuitemradio',{checked:true})).toHaveText('Mayor importe')
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(/sortBy=Highest/)
  const search=page.getByRole('textbox',{name:'Buscar transacciones',exact:true})
  await search.pressSequentially('Cinema')
  await select(page,'language','English')
  await expect(page.getByRole('textbox',{name:'Search transactions',exact:true})).toHaveValue('Cinema')
  await page.reload()
  await expect(page.getByRole('textbox',{name:'Search transactions',exact:true})).toHaveValue('Cinema')
  const devBadge=page.getByRole('button',{name:'Collapse issues badge',exact:true})
  if(await devBadge.isVisible()) await devBadge.click()
  await page.getByRole('link',{name:'Transactions',exact:true}).click()
  await expect(page.getByRole('textbox',{name:'Search transactions',exact:true})).toHaveValue('')
  await page.goBack()
  await expect(page.getByRole('textbox',{name:'Search transactions',exact:true})).toHaveValue('Cinema')
  expect(errors).toEqual([])
  expect(rateRequests).toEqual([])
  expect((await context.cookies()).find(cookie => cookie.name === 'finance-currency')).toBeUndefined()
})

for (const legacyCurrency of ['MXN', 'bad']) {
  test(`language changes ignore and never renew legacy ${legacyCurrency}`, async ({ page, context }) => {
    await context.addCookies([
      { name: 'finance-language', value: 'es', url: 'http://localhost:3100' },
      { name: 'finance-currency', value: legacyCurrency, url: 'http://localhost:3100', expires: Math.floor(Date.now() / 1000) + 3600 },
    ])
    const previousCookie = (await context.cookies()).find(cookie => cookie.name === 'finance-currency')
    await page.goto('/finance')
    for (const language of ['es', 'en']) {
      if (language === 'en') await select(page, 'language', 'English')
      await page.reload()
      await expect(page.locator('html')).toHaveAttribute('lang', language)
      const expected = '$5,113.75'
      await expect(page.getByText(expected, { exact: true })).toBeVisible()
      expect((await context.cookies()).find(cookie => cookie.name === 'finance-currency')).toEqual(previousCookie)
    }
  })
}
for (const language of ['en','es']) {
  test(`all seven routes render ${language} before JavaScript`, async ({ browser }) => {
    const context=await browser.newContext({javaScriptEnabled:false,locale:'es-MX'})
    await context.addCookies([{name:'finance-language',value:language,url:'http://localhost:3100'}])
    await enterGuest(context)
    const page=await context.newPage()
    for(const route of routes){
      await page.goto(route)
      await expect(page.locator('html')).toHaveAttribute('lang',language)
      await expect(page.locator('#preference-language')).toContainText(language === 'es' ? 'Español' : 'English')
      await expect(page.locator('#preference-currency')).toHaveCount(0)
      await expect(page.locator('h1').first()).toBeVisible()
      await expect(page.getByText(language==='es'?'Solo presentación: cambiar la moneda no convierte los importes.':'Presentation only: changing currency does not convert amounts.',{exact:true})).toHaveCount(0)
    }
    await page.goto('/finance')
    await expect(page.getByText(/5,113\.75/)).toBeVisible()
    await expect(page.getByText('Ticket refund',{exact:true})).toBeVisible()
    await context.close()
  })
}
test('request languages are isolated and legacy currency cookies have no effect', async ({ browser }) => {
  const contexts=await Promise.all([browser.newContext({locale:'es-MX'}),browser.newContext(),browser.newContext()])
  await contexts[1].addCookies([{name:'finance-language',value:'invalid',url:'http://localhost:3100'},{name:'finance-currency',value:'MXN',url:'http://localhost:3100'}])
  await contexts[2].addCookies([{name:'finance-language',value:'es',url:'http://localhost:3100'},{name:'finance-currency',value:'bad',url:'http://localhost:3100'}])
  await Promise.all(contexts.map(async (context,i) => {
    await enterGuest(context)
    const page=await context.newPage();await page.goto('/finance')
    await expect(page.locator('html')).toHaveAttribute('lang',i===2?'es':'en')
    await expect(page.locator('#preference-currency')).toHaveCount(0)
    const expected = '$5,113.75'
    await expect(page.getByText(expected, { exact: true })).toBeVisible()
  }))
  await Promise.all(contexts.map(c=>c.close()))
})
test('Spanish auth forms and money previews preserve demo safeguards', async ({ page, context }) => {
  await context.addCookies([{name:'finance-language',value:'es',url:'http://localhost:3100'},{name:'finance-currency',value:'MXN',url:'http://localhost:3100'}])
  await page.goto('/finance/pots')
  await page.getByRole('button',{name:'+Agregar dinero',exact:true}).first().click()
  await page.getByRole('spinbutton',{name:'Importe a agregar',exact:true}).fill('10.50')
  await expect(page.getByRole('dialog').getByText(/169\.50/)).toBeVisible()
  await expect(page.getByRole('button',{name:'Confirmar depósito',exact:true})).toBeDisabled()
  await page.getByRole('button',{name:'Cerrar',exact:true}).click()
  for (const route of ['/login','/singup']) {
    await page.goto(route)
    await page.getByLabel('Nombre de usuario',{exact:true}).fill('test')
    await page.locator('input[name="password"]').fill('dummy-password')
    await expect(page.locator('form')).toHaveAttribute('method','post')
    await expect(page.locator('button[type="submit"]')).toBeEnabled()
    await expect(page).toHaveURL(new RegExp(route+'$'))
  }
})
test('blocked cookies keep the previous effective language and show an error', async ({ page }) => {
  await page.addInitScript(() => {
    const original = Object.getOwnPropertyDescriptor(Document.prototype,'cookie')!
    Object.defineProperty(document,'cookie',{ get: () => original.get!.call(document), set: () => {} })
  })
  await page.setViewportSize({ width: 320, height: 844 })
  await page.goto('/finance')
  const mainBefore=(await page.locator('main').boundingBox())!
  await page.locator('#preference-language').click()
  await page.getByRole('option',{name:'Español',exact:true}).click()
  await expect(page.getByRole('alert').filter({hasText:'Could not save preferences.'})).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang','en')
  await expect(page.locator('#preference-language')).toContainText('English')
  await expect(page.locator('#preference-language')).toBeEnabled()
  const main = (await page.locator('main').boundingBox())!
  expect(main.y).toBe(mainBefore.y)
  await expect(page.locator('.Toastify__toast-container')).toHaveCSS('position','fixed')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
for (const language of ['en', 'es']) for (const width of [1280, 390, 320]) {
  test(`localized money and layouts: ${language} at ${width}px`, async ({ browser }) => {
    const context=await browser.newContext()
    await context.addCookies([{name:'finance-language',value:language,url:'http://localhost:3100'}])
    await enterGuest(context)
    const page=await context.newPage()
    const errors: string[]=[]
    page.on('pageerror',error=>errors.push(error.message))
  page.on('console',message=>{if(message.type()==='error' && /hydration|hydrated|server rendered HTML/i.test(message.text()))errors.push(message.text())})
      await page.setViewportSize({width,height:900})
      for (const route of routes) {
        await page.goto(route)
        await expect(page.locator('h1').first()).toBeVisible()
        await expect(page.locator('body')).not.toContainText(/\b(?:USD|MXN)\b/)
        const selector = page.getByRole('combobox', { name: language === 'es' ? 'Idioma' : 'Language', exact: true })
        await expect(selector).toHaveCount(1)
        await expect(selector).toBeVisible()
        const control = (await selector.boundingBox())!
        expect(control.x + control.width).toBeCloseTo(width - (width >= 768 ? 40 : 16), 0)
        await expect.poll(async () => (await page.locator('h1').first().boundingBox())?.y ?? -Infinity)
          .toBeGreaterThanOrEqual(control.y + control.height)
        if (route.startsWith('/finance')) {
          const label = language === 'es' ? 'Cerrar sesión' : 'Logout'
          const logout = page.getByRole('button', { name: label, exact: true })
          await expect(logout).toHaveAttribute('title', label)
          await expect(logout.locator('svg')).toBeVisible()
          const exit = (await logout.boundingBox())!
          const content = (await page.locator('main').boundingBox())!
          expect(exit.x).toBeCloseTo(content.x + (width >= 768 ? 40 : 16), 0)
          expect(exit.y).toBeCloseTo(control.y, 0)
          expect(exit.x + exit.width).toBeLessThan(control.x)
          await expect(page.locator('body')).not.toContainText(/Demo data|Datos de ejemplo/)
        }
        if (width >= 1024 && route.startsWith('/finance')) {
          const navigation = (await page.locator('nav').first().boundingBox())!
          expect(navigation.y).toBe(0)
          expect(navigation.height).toBe(900)
        }
        await selector.click()
        const menu = page.getByRole('listbox')
        await expect(menu).toBeVisible()
        const menuBox = (await menu.boundingBox())!
        expect(menuBox.x).toBeGreaterThanOrEqual(0)
        expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(width)
        await page.keyboard.press('Escape')
        await expect(menu).toHaveCount(0)
        if (route === '/finance/transactions') {
          await expect(page.locator('main img')).toHaveCount(0)
          await expect(page.getByText('Ticket refund', { exact: true }).filter({ visible: true })).toBeVisible()
          if (width >= 768) await expect(page.getByRole('columnheader', { name: language === 'es' ? 'Nombre' : 'Name', exact: true })).toBeVisible()
        }
        if (route === '/finance/budgets' || route === '/finance/pots') {
          const action = page.locator('main header').first().locator('button')
          await expect(action).toBeVisible()
          await action.click()
          await expect(page.getByRole('dialog')).toBeVisible()
          await page.getByRole('button', { name: language === 'es' ? 'Cerrar' : 'Close', exact: true }).click()
          await expect(page.getByRole('dialog')).toHaveCount(0)
        }
        if (language === 'es' && ['/finance', '/finance/budgets', '/login', '/singup'].includes(route)) {
          await page.screenshot({ path: `/tmp/finance-language-${route.split('/').pop()}-${width}.png` })
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${language} ${route} at ${width}px`).toBe(true)
        expect(await page.locator('main').evaluate(element => element.scrollWidth <= element.clientWidth), `${language} ${route} content at ${width}px`).toBe(true)
        const amount=route==='/finance'?'$5,113.75':route==='/finance/pots'?'$159.00':route==='/finance/recurring-bills'?'$1,550.00':undefined
        if (amount!==undefined) await expect(page.getByText(amount,{exact:true}).first()).toBeVisible()
        if (route==='/finance/budgets') await expect(page.getByText('$270.50',{exact:true})).toBeVisible()
      }
    if (language==='es') {
      await page.goto('/finance/pots')
      await page.getByRole('button',{name:'+Agregar dinero',exact:true}).first().click()
      await page.getByRole('spinbutton',{name:'Importe a agregar',exact:true}).fill('10.50')
      await expect(page.getByRole('heading',{name:"Agregar a 'Savings'",exact:true})).toBeVisible()
      await expect(page.getByRole('dialog')).toHaveCSS('opacity','1')
      await page.screenshot({path:`/tmp/finance-language-pot-dialog-${width}.png`})
    }
    expect(errors).toEqual([])
    await context.close()
  })
}
test('Spanish recurring bill labels keep search, sort and totals', async ({ page, context }) => {
  await context.addCookies([{name:'finance-language',value:'es',url:'http://localhost:3100'}])
  await page.goto('/finance/recurring-bills')
  await expect(page.getByText(/1,550\.00/)).toBeVisible()
  await expect(page.getByText(/1,510\.00/)).toBeVisible()
  await page.getByRole('textbox',{name:'Buscar pagos',exact:true}).fill('Elevate')
  await expect(page.getByRole('heading',{name:'Elevate Education',exact:true})).toBeVisible()
  await expect(page.getByText('Cada mes, día 1',{exact:true}).filter({visible:true})).toBeVisible()
  await page.getByRole('combobox',{name:'Ordenar por',exact:true}).click()
  await page.getByRole('option',{name:'Mayor importe',exact:true}).click()
  await expect(page.getByRole('combobox',{name:'Ordenar por',exact:true})).toContainText('Mayor importe')
})

test('flagged language selector supports keyboard selection and visible focus', async ({ page }) => {
  await page.goto('/login')
  const selector = page.locator('#preference-language')
  await page.keyboard.press('Tab')
  await expect(selector).toBeFocused()
  await expect(selector).toHaveCSS('outline-style', 'solid')
  await expect(selector).toHaveCSS('outline-width', '2px')
  await expect(selector).toHaveAccessibleName('Language')
  await expect(selector.locator('img')).toHaveAttribute('src', '/flags/us.svg')
  await page.keyboard.press('Enter')
  for (const [language, flag] of [['English', 'us'], ['Español', 'mx']]) {
    const option = page.getByRole('option', { name: language, exact: true })
    await expect(option).toHaveAccessibleName(language)
    const image = option.locator('img')
    await expect(image).toHaveAttribute('src', `/flags/${flag}.svg`)
    await expect(image).toHaveAttribute('alt', '')
    await expect(image).toHaveAttribute('aria-hidden', 'true')
    await expect(image).toHaveAttribute('width', '24')
    await expect(image).toHaveAttribute('height', '16')
    await expect(image).toBeVisible()
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true)
  }
  await page.keyboard.press('End')
  await expect(page.getByRole('option', { name: 'Español', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  await expect(selector).toHaveAccessibleName('Idioma')
  await expect(selector.locator('img')).toHaveAttribute('src', '/flags/mx.svg')
  await expect(selector).toBeEnabled()
  if (!(await selector.evaluate(element => element === document.activeElement))) await page.keyboard.press('Tab')
  await expect(selector).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('listbox')).toBeVisible()
  await page.keyboard.press('Home')
  await expect(page.getByRole('option', { name: 'English', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(selector.locator('img')).toHaveAttribute('src', '/flags/us.svg')
})

test('language selector prevents concurrent changes during refresh', async ({ page }) => {
  await page.goto('/finance')
  let releaseRefresh!: () => void
  const refreshGate = new Promise<void>(resolve => { releaseRefresh = resolve })
  await page.route('**/finance?*', async route => {
    if (route.request().headers()['rsc'] === '1') await refreshGate
    await route.continue()
  })
  const selector = page.locator('#preference-language')
  try {
    await selector.click()
    await page.getByRole('option', { name: 'Español', exact: true }).click()
    await expect(selector).toBeDisabled()
    await expect(selector.locator('[data-slot="skeleton"]')).toBeVisible()
    await expect(selector).toContainText('English')
  } finally {
    releaseRefresh()
  }
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  await expect(selector).toBeEnabled()
  await expect(selector).toContainText('Español')
})

test('desktop language selector scrolls away with the content', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/finance/pots')
  const selector = page.locator('#preference-language')
  const scrollArea = page.locator('main').locator('..')
  const initial = (await selector.boundingBox())!
  await scrollArea.evaluate(element => { element.scrollTop = 300 })
  await expect.poll(() => scrollArea.evaluate(element => element.scrollTop)).toBe(300)
  expect((await selector.boundingBox())!.y).toBeCloseTo(initial.y - 300, 0)
  const navigation = (await page.locator('nav').first().boundingBox())!
  expect(navigation.y).toBe(0)
  expect(navigation.height).toBe(720)
  await scrollArea.evaluate(element => { element.scrollTop = 0 })
  await expect(selector).toBeInViewport()
  await selector.click()
  await page.getByRole('option', { name: 'Español', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
})
