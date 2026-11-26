import { expect, test, type BrowserContext, type Locator, type Page } from '@playwright/test'
const origin='http://localhost:3100',upstream='http://127.0.0.1:3101'
async function account(context:BrowserContext,language='en') {
  const username=`finance-${Date.now()}-${Math.random()}`,password='test-password-123'
  const token=await (await context.request.get(origin+'/api/auth/csrf')).json()
  const headers={Origin:origin,[token.headerName]:token.token}
  expect((await context.request.post(origin+'/api/auth/register',{headers,data:{name:'Finance test',username,password}})).status()).toBe(201)
  expect((await context.request.post(origin+'/api/auth/login',{headers,form:{username,password}})).status()).toBe(204)
  await context.addCookies([{name:'finance-language',value:language,url:origin}])
  return username
}
async function write(context:BrowserContext,path:string,method='POST',body?:string) {
  const token=await (await context.request.get(origin+'/api/auth/csrf')).json()
  return context.request.fetch(origin+'/api/finance/'+path,{method,headers:{Origin:origin,[token.headerName]:token.token,'Content-Type':'application/json'},data:body})
}
async function control(context:BrowserContext,path:string,data?:unknown) {
  const cookie=(await context.cookies()).find(item=>item.name === 'JSESSIONID')!
  return context.request.post(upstream+'/__finance/'+path,{headers:{Cookie:`JSESSIONID=${cookie.value}`},data})
}
async function choose(page:Page, label:string, text:string) {
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('combobox',{name:label,exact:true})
    .or(dialog.getByRole('button',{name:label,exact:true})).click()
  await page.getByRole('option',{name:text,exact:true})
    .or(page.getByRole('menuitemradio',{name:text,exact:true})).click()
}
async function save(page:Page) {
  const dialog=page.getByRole('dialog')
  const response = page.waitForResponse(response => response.url().includes('/api/finance/') &&
    ['POST', 'PUT', 'DELETE'].includes(response.request().method()))
  await dialog.locator('button[type="submit"]').click()
  await expect(dialog).toBeHidden()
  expect((await response).ok()).toBe(true)
}
async function category(page:Page,name:string) {await page.getByRole('button',{name:'+ Add category',exact:true}).click();await page.getByRole('dialog').getByLabel('Name',{exact:true}).fill(name);await save(page)}
async function menu(page:Page,row:Locator,action:string) {await row.getByRole('button',{name:/^Actions:/}).click();await page.getByRole('menuitem',{name:action,exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible()}

test('category dialogs preserve the draft throughout the exit animation', async ({page, context}) => {
  await account(context)
  await write(context, 'categories', 'POST', '{"name":"First"}')
  await write(context, 'categories', 'POST', '{"name":"Second"}')
  await page.goto('/finance/categories')
  const add = page.getByRole('button', {name:'+ Add category', exact:true})
  const dialog = page.getByRole('dialog')

  for (const [record, dismiss] of [
    [null, () => page.keyboard.press('Escape')],
    ['First', () => dialog.getByRole('button', {name:'Close', exact:true}).click()],
    ['Second', () => page.mouse.click(4, 4)],
  ] as const) {
    const row = page.getByRole('row').filter({hasText: record ?? 'First'})
    if (record) await menu(page, row, 'Edit')
    else await add.click()
    await expect(dialog.getByLabel('Name', {exact:true})).toHaveValue(record ?? '')
    await dialog.getByLabel('Name', {exact:true}).fill('Unsaved draft')
    await dialog.evaluate(panel => {
      const snapshot = () => ({
        title: panel.querySelector('h2')?.textContent,
        value: panel.querySelector('input')?.value ?? null,
        fields: panel.querySelectorAll('input').length,
      })
      const before = snapshot()
      const observer = new MutationObserver(() => {
        if (panel.dataset.state !== 'closed') return
        document.body.dataset.dialogExit = JSON.stringify({before, during: snapshot()})
        observer.disconnect()
      })
      delete document.body.dataset.dialogExit
      observer.observe(panel, {attributes: true, attributeFilter: ['data-state']})
    })
    await dismiss()
    await expect(dialog).toHaveCount(0)
    const snapshot = JSON.parse((await page.locator('body').getAttribute('data-dialog-exit'))!)
    expect(snapshot.before).toMatchObject({fields:1, value:'Unsaved draft'})
    expect(snapshot.during).toEqual(snapshot.before)
    await expect(record ? row.getByRole('button', {name:/^Actions:/}) : add).toBeFocused()
  }
  await page.emulateMedia({reducedMotion:'reduce'})
  await add.click()
  await expect(dialog.getByLabel('Name', {exact:true})).toHaveValue('')
  await expect(dialog).toHaveCSS('animation-name', 'none')
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(add).toBeFocused()
})

test('a pending category save closes and can be recovered after navigating', async ({page, context}) => {
  await account(context)
  await page.goto('/finance/categories')
  const response = Promise.withResolvers<void>()
  let writes = 0
  await page.route('**/api/finance/categories', async route => {
    if (route.request().method() !== 'POST') return route.continue()
    if (++writes > 1) return route.continue()
    await response.promise
    await route.fulfill({status:409})
  })
  const add = page.getByRole('button', {name:'+ Add category', exact:true})
  const dialog = page.getByRole('dialog')
  await add.click()
  await dialog.getByLabel('Name', {exact:true}).fill('My draft')
  await dialog.locator('form').evaluate(form => {
    const editor = form as HTMLFormElement
    editor.requestSubmit()
    editor.requestSubmit()
  })
  try {
    await expect(dialog).toHaveCount(0)
    await expect(add).toBeFocused()
    await expect(page.getByRole('row').filter({hasText:'My draft'})).toBeVisible()
    await page.getByRole('link', {name:'Transactions', exact:true}).click()
    await expect(page).toHaveURL('/finance/transactions')
    await expect(page.getByRole('heading', {name:'Transactions', exact:true})).toBeFocused()
    expect(writes).toBe(1)
  } finally { response.resolve() }
  await page.getByRole('button', {name:'Review draft'}).click()
  await expect(dialog.getByLabel('Name', {exact:true})).toHaveValue('My draft')
  await expect(dialog.getByRole('alert')).toContainText('conflicts')
  await save(page)
  expect(writes).toBe(2)
  await page.getByRole('link', {name:'Categories', exact:true}).click()
  const row = page.getByRole('row').filter({hasText:'My draft'})
  await expect(row).toBeVisible()
  await menu(page,row,'Delete')
  await save(page)
  await expect(row).toHaveCount(0)
  await expect(page.getByRole('heading', {name:'Categories', exact:true})).toBeFocused()
})

test('retrying categories with the keyboard does not submit a valid edit', async ({page, context}) => {
  await account(context)
  const cat = await (await write(context,'categories','POST','{"name":"Food"}')).json()
  await write(context,'budgets','POST',`{"categoryId":${cat.id},"spendingLimit":100,"color":"#277C78"}`)
  await page.goto('/finance/budgets')
  const dialog = page.getByRole('dialog')
  let reads = 0, writes = 0
  let unavailable = true
  await page.route('**/api/finance/categories', route => {
    reads++
    return unavailable ? route.fulfill({status:503}) : route.continue()
  })
  page.on('request', request => {
    if (request.url().includes('/api/finance/') && request.method() !== 'GET') writes++
  })
  await menu(page, page.locator('article').filter({has:page.getByRole('heading',{name:'Food',exact:true})}), 'Edit')
  await dialog.getByLabel('Maximum Spending',{exact:true}).fill('125')
  const reload = dialog.getByRole('button', {name:'Reload data', exact:true})
  await expect(reload).toBeVisible()
  const previousReads = reads
  unavailable = false
  await reload.focus()
  await page.keyboard.press('Enter')
  await expect(reload).toHaveCount(0)
  await expect(dialog.getByLabel('Maximum Spending', {exact:true})).toHaveValue('125')
  expect(reads - previousReads).toBe(1)
  expect(writes).toBe(0)
})

test('search publishes the settled value and preserves filters through navigation', async ({page, context}) => {
  await account(context)
  await write(context,'categories','POST','{"name":"Search category"}')
  for (const [path, resource, label] of [
    ['/finance/transactions', 'transactions', 'Search transactions'],
    ['/finance/recurring-bills', 'recurring-payments', 'Search bills'],
  ] as const) {
    await page.goto(path + '?page=1')
    const input = page.getByRole('textbox', {name:label, exact:true})
    await expect(input).toBeVisible()
    await expect(page.locator('main [inert]')).toHaveCount(0)
    const searches: string[] = []
    const listen = (request: import('@playwright/test').Request) => {
      const url = new URL(request.url())
      if (url.pathname === '/api/finance/' + resource) searches.push(url.searchParams.get('search') ?? '')
    }
    page.on('request', listen)
    try {
      await input.pressSequentially('mercado',{delay:80})
      await expect(input).toHaveValue('mercado')
      await expect.poll(() => searches).toEqual(['mercado'])
      await expect(page).toHaveURL(/page=1&query=mercado/)

      await input.dispatchEvent('compositionstart')
      await input.fill('漢字')
      await expect(page).toHaveURL(/query=mercado/)
      await input.dispatchEvent('compositionend', {data:'漢字'})
      await expect.poll(() => searches).toEqual(['mercado', '漢字'])

      await input.fill('latest')
      if (resource === 'recurring-payments') {
        await page.getByLabel('Month',{exact:true}).fill('2027-02')
        await expect(page).toHaveURL(/month=2027-02/)
      } else {
        await page.getByRole('combobox',{name:'Sort By',exact:true}).click()
        await page.getByRole('option',{name:'Oldest',exact:true}).click()
        await expect(page).toHaveURL(/sortBy=oldest/)
      }
      await expect.poll(() => searches.at(-1)).toBe('latest')
      await page.reload()
      await expect(input).toHaveValue('latest')
      await expect(page.locator('main [inert]')).toHaveCount(0)
      const saved = page.url()
      await input.fill('')
      await expect(page).not.toHaveURL(/query=/)
      await page.evaluate(url => window.history.pushState(null,'',url),saved)
      await expect(input).toHaveValue('latest')
      await page.goBack()
      await expect(input).toHaveValue('')
      await page.goForward()
      await expect(input).toHaveValue('latest')
      if (resource === 'transactions') {
        await page.getByRole('combobox',{name:'Category',exact:true}).click()
        await page.getByRole('option',{name:'Search category',exact:true}).click()
        await expect(page).toHaveURL(/category=\d+/)
        await expect(page).toHaveURL(/query=latest/)
      }
      await input.fill('leave before publish')
      await page.getByRole('link',{name:'Categories',exact:true}).click()
      await expect(page).toHaveURL('/finance/categories')
      expect(searches).not.toContain('leave before publish')
    } finally { page.off('request', listen) }
  }
})

test('editors load category choices on demand and reuse a fresh list', async ({page, context}) => {
  await account(context)
  await write(context,'categories','POST','{"name":"Choices"}')
  for (const [path, label] of [
    ['/finance/budgets', /^\+ Add New Budget$/i],
    ['/finance/recurring-bills', /^\+ Add recurring payment$/i],
  ] as const) {
    let reads = 0
    await page.route('**/api/finance/categories', route => { reads++; return route.continue() })
    await page.goto(path)
    const add = page.getByRole('button',{name:label})
    await expect(add).toBeVisible()
    await expect(page.locator('main [inert]')).toHaveCount(0)
    expect(reads).toBe(0)
    for (let attempt = 0; attempt < 2; attempt++) {
      await add.click()
      await choose(page,'Category','Choices')
      await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).click()
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expect(add).toBeFocused()
      expect(reads).toBe(1)
    }
    await page.unroute('**/api/finance/categories')
  }
})

test('reporting cuts validate the day and refresh only the summary', async ({page, context}) => {
  await account(context)
  await page.goto('/finance')
  const configure = page.getByRole('button',{name:'Configure period', exact:true})
  await expect(configure).toBeVisible()
  const dialog = page.getByRole('dialog')
  const updates: number[] = []
  const reads: string[] = []
  await expect(page.getByText('Loading…', {exact:true})).toHaveCount(0)
  // The initial navigation can prefetch category choices independently of a save.
  page.on('request', request => {
    const url = new URL(request.url())
    if (!url.pathname.startsWith('/api/finance/')) return
    if (request.method() === 'PUT') updates.push(request.postDataJSON().startDay)
    else if (request.method() === 'GET' && (updates.length || url.pathname !== '/api/finance/categories')) reads.push(url.pathname)
  })
  await configure.click()
  const day = dialog.getByLabel('Start day', {exact:true})
  const submit = dialog.getByRole('button', {name:'Save', exact:true})
  for (const value of ['', '0', '1.5', '32']) {
    await day.fill(value)
    await submit.click()
    await expect(day).toHaveAttribute('aria-invalid','true')
    expect(updates).toEqual([])
  }
  const before = await page.getByText(/Reporting period/).textContent()
  for (const [i, value] of ['01','1','31'].entries()) {
    await day.fill(value)
    await save(page)
    await expect.poll(() => reads.length).toBe(i + 1)
    if (i < 2) await configure.click()
  }
  expect(updates).toEqual([1,1,31])
  expect([...new Set(reads)]).toEqual(['/api/finance/financial-summary'])
  await expect(page.getByText(/Reporting period/)).not.toHaveText(before ?? '')
})

test('zero-spend budgets skip history and keep the exact chart label', async ({page, context}) => {
  await account(context)
  const categoryIds: number[] = []
  for (const name of ['Paper', 'Ink', 'Pens']) {
    const cat = await (await write(context,'categories','POST',JSON.stringify({name}))).json()
    categoryIds.push(cat.id)
    await write(context,'budgets','POST',`{"categoryId":${cat.id},"spendingLimit":100,"color":"#277C78"}`)
  }
  await write(context,'transactions','POST',`{"name":"Income only","categoryId":${categoryIds[0]},"transactionDate":"2027-03-20","amount":50}`)
  let histories = 0
  const started = Promise.withResolvers<void>(), release = Promise.withResolvers<void>()
  await page.route('**/api/finance/transactions?*', async route => {
    if (!new URL(route.request().url()).searchParams.has('categoryId')) return route.continue()
    histories++
    const response = await route.fetch()
    started.resolve()
    await release.promise
    await route.fulfill({response}).catch(() => {})
  })
  for (const path of ['/finance','/finance/budgets']) {
    await page.goto(path)
    await expect(page.locator('[data-chart]')).toContainText('$0.00')
    await expect(page.locator('[data-chart]')).toContainText('$300.00')
  }
  await expect(page.getByText('No recent expenses.',{exact:true})).toHaveCount(3)
  const cards = page.locator('article').filter({
    has: page.getByRole('button', { name: /^Actions: (Paper|Ink|Pens)/ }),
  })
  const spending = page.locator('article').filter({ has: page.locator('[data-chart]') })
  const first = (await cards.nth(0).boundingBox())!
  const second = (await cards.nth(1).boundingBox())!
  const summary = (await spending.boundingBox())!
  expect(first.y).toBeCloseTo(summary.y)
  expect(first.height).toBeLessThan(summary.height)
  expect(second.y - (first.y + first.height)).toBeCloseTo(24)
  expect(histories).toBe(0)
  const expense = await (await write(context,'transactions','POST',`{"name":"Late preview","categoryId":${categoryIds[0]},"transactionDate":"2027-03-20","amount":-10}`)).json()
  await page.reload()
  try {
    await started.promise
    expect(histories).toBe(1)
    await write(context,`transactions/${expense.id}`,'DELETE')
    const paper = page.locator('article').filter({has:page.getByRole('heading',{name:'Paper',exact:true})})
    await menu(page,paper,'Edit')
    await page.getByRole('dialog').getByLabel('Maximum Spending',{exact:true}).fill('110')
    await save(page)
    await expect(page.getByText('No recent expenses.',{exact:true})).toHaveCount(3)
  } finally { release.resolve() }
  await expect(page.getByText('Late preview',{exact:true})).toHaveCount(0)
})

test('budget chart keeps large amounts inside the ring', async ({page, context}) => {
  await account(context)
  const category = await (await write(context,'categories','POST','{"name":"Equipment"}')).json()
  expect((await write(context,'budgets','POST',`{"categoryId":${category.id},"spendingLimit":450000000.75,"color":"#277C78"}`)).ok()).toBe(true)
  expect((await write(context,'transactions','POST',`{"categoryId":${category.id},"name":"Equipment purchase","amount":-123456789.25,"transactionDate":"2027-03-20"}`)).ok()).toBe(true)

  await page.setViewportSize({width:390,height:844})
  for (const path of ['/finance','/finance/budgets']) {
    await page.goto(path)
    const chart = page.locator('[data-chart]')
    for (const amount of ['$123,456,789.25', 'of $450,000,000.75 limit']) {
      const label = chart.getByText(amount,{exact:true})
      await expect(label).toBeVisible()
      await expect.poll(async () => (await label.boundingBox())?.width).toBeLessThan(125)
    }
  }
})

test('financial table headers match each row at compact and desktop widths', async ({page, context}) => {
  await account(context)
  const cat = await (await write(context,'categories','POST','{"name":"Utilities"}')).json()
  await write(context,'transactions','POST',`{"name":"Meter","categoryId":${cat.id},"transactionDate":"2027-03-20","amount":-10}`)
  await write(context,'recurring-payments','POST',`{"name":"Service","categoryId":${cat.id},"type":"SUBSCRIPTION","amount":10,"firstDueDate":"2027-03-20"}`)
  for (const width of [390,1280,320]) {
    await page.setViewportSize({width,height:900})
    for (const [path, name, headers, row, cells] of [
      ['/finance/transactions','Transactions',['Name','Category','Transaction Date','Amount','Actions'],'Meter',5],
      ['/finance/recurring-bills','Recurring Bills',['Bill Title','Due Date','Amount','Actions'],'Service',4],
    ] as const) {
      await page.goto(path)
      const table = page.getByRole('table',{name,exact:true})
      await expect(table.getByRole('columnheader')).toHaveText([...headers])
      await expect(page.locator('main [inert]')).toHaveCount(0)
      await expect(table.getByRole('cell')).toHaveCount(cells)
      const action = table.getByRole('button',{name:new RegExp('^Actions: '+row)})
      await expect(action).toHaveCount(1)
      await action.focus()
      await action.press('Enter')
      await expect(page.getByRole('menuitem',{name:'Edit',exact:true})).toBeVisible()
      await page.keyboard.press('Escape')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    }
  }
})

test('floating notifications preserve layout, translations and dismissal',async({page,context})=>{
  await account(context)
  for(const [width,language,add,name,saved,close] of [[1280,'en','+ Add category','Name','Saved.','Close'],[390,'es','+ Agregar categoría','Nombre','Guardado.','Cerrar']] as const) {
    await page.setViewportSize({width,height:900})
    await context.addCookies([{name:'finance-language',value:language,url:origin}])
    await page.goto('/finance/categories')
    await page.evaluate(() => document.fonts.ready.then(() => {}))
    await expect(page.locator('main [inert]')).toHaveCount(0)
    const heading=page.getByRole('heading',{level:1}),before=(await heading.boundingBox())!
    await page.getByRole('button',{name:add,exact:true}).click()
    await page.getByRole('dialog').getByLabel(name,{exact:true}).fill('Toast '+language)
    await save(page)
    const notice=page.locator('.Toastify__toast').filter({hasText:saved})
    await expect(notice).toBeVisible()
    const container = page.locator('.Toastify__toast-container')
    await expect(container).toHaveCSS('position','fixed')
    expect((await heading.boundingBox())!.y).toBe(before.y)
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (width === 1280) {
      await expect(container).toHaveCSS('bottom','16px')
      await expect(container).toHaveCSS('right','16px')
      await page.setViewportSize({width: 768, height: 900})
      await expect(container).toHaveCSS('top','16px')
      await expect(container).toHaveCSS('left','16px')
    }
    await notice.getByRole('button',{name:close,exact:true}).click()
    await expect(notice).toBeHidden()
  }
})

test('pot undo notification expires after ten seconds even while hovered',async({page,context})=>{
  await account(context)
  await write(context,'savings-pots','POST','{"name":"Undo deadline","targetAmount":100,"color":"#277C78"}')
  await page.clock.install()
  await page.goto('/finance/pots')
  const pot=page.locator('article').filter({has:page.getByRole('heading',{name:'Undo deadline',exact:true})})
  await menu(page,pot,'Delete');await save(page)
  const notice=page.locator('.Toastify__toast').filter({hasText:'Pot deleted.'})
  await expect(notice.getByRole('button',{name:'Undo',exact:true})).toBeVisible()
  await notice.hover()
  await page.clock.runFor(10_100)
  await expect(notice.getByRole('button',{name:'Undo',exact:true})).toHaveCount(0)
  await expect(notice).toContainText('The undo window has expired.')
  await expect(pot).toHaveCount(0)
})

test('month filters show the current month inside the calendar without extra text',async({page,context})=>{
  await account(context)
  await page.goto('/finance/budgets')
  const currentMonth=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit'}).format(new Date())
  await expect(page.getByLabel('Month',{exact:true})).toHaveValue(currentMonth)
  const cat=await(await write(context,'categories','POST','{"name":"Monthly budget"}')).json()
  await write(context,'budgets','POST',`{"categoryId":${cat.id},"spendingLimit":200,"color":"#277C78"}`)
  for(const route of ['/finance/budgets','/finance/recurring-bills']) {
    await page.goto(route)
    await expect(page.getByRole('button',{name:'Logout',exact:true})).toBeEnabled()
    const calendar=page.getByLabel('Month',{exact:true})
    await expect(calendar).toHaveValue('2027-03')
    await expect(page.getByRole('button',{name:'Current month',exact:true})).toHaveCount(0)
    await expect(page.getByText('2027-03',{exact:true})).toHaveCount(0)
    await page.getByRole('button',{name:'Open calendar · Month'}).click()
    const picker = page.getByRole('dialog',{name:'Month',exact:true})
    await picker.getByRole('combobox',{name:'Choose the Month'}).selectOption('1')
    await picker.getByRole('button',{name:'Select month'}).click()
    await expect(page).toHaveURL(/month=2027-02/)
    await page.reload()
    await expect(page.getByRole('button',{name:'Logout',exact:true})).toBeEnabled()
    await expect(page.locator('main [inert]')).toHaveCount(0)
    await expect(calendar).toHaveValue('2027-02')
    await calendar.fill('')
    await expect(page).not.toHaveURL(/month=/)
    await expect(calendar).toHaveValue('2027-03')
  }
})

test('budget tooltips show exact amounts and ignore the decorative ring',async({page,context})=>{
  await account(context)
  const cat=await(await write(context,'categories','POST','{"name":"Exact budget"}')).json()
  await write(context,'budgets','POST',`{"categoryId":${cat.id},"spendingLimit":99999999999999999.99,"color":"#277C78"}`)
  await write(context,'transactions','POST',`{"name":"Exact expense","categoryId":${cat.id},"transactionDate":"2027-03-20","amount":-99999999999999999.99}`)
  await page.clock.install()
  const errors:Error[]=[]
  page.on('pageerror',error=>errors.push(error))
  for(const route of ['/finance/budgets','/finance']) {
    await page.goto(route)
    const chart=page.locator('[data-chart]').first()
    await expect(chart.locator('.recharts-pie')).toHaveCount(2)
    await page.clock.runFor(2500)
    const svg=chart.locator('svg.recharts-surface')
    const box=(await svg.boundingBox())!
    await expect(async()=>{
      await page.mouse.move(box.x,box.y)
      await page.mouse.move(box.x+box.width/2+64,box.y+box.height/2-64)
      await expect(chart.locator('.recharts-tooltip-item-value')).toHaveText('$99,999,999,999,999,999.99')
    }).toPass({timeout:5000})
    await page.mouse.move(box.x+box.width/2+53,box.y+box.height/2-53)
    await expect(chart.locator('.recharts-tooltip-item-value')).toHaveCount(0)
    await expect(svg).toBeVisible()
    expect(errors).toEqual([])
  }
})

test('original finance cards and pot previews remain usable on desktop and mobile',async({page,context})=>{
  test.setTimeout(120_000)
  await account(context)
  await page.clock.install()
  const category=await(await write(context,'categories','POST','{"name":"Personal"}')).json()
  await write(context,'budgets','POST',`{"categoryId":${category.id},"spendingLimit":200,"color":"#277C78"}`)
  await write(context,'transactions','POST',`{"name":"Lunch","categoryId":${category.id},"transactionDate":"2027-03-20","amount":-50}`)
  const pot=await(await write(context,'savings-pots','POST','{"name":"Holiday","targetAmount":200,"color":"#277C78"}')).json()
  await write(context,`savings-pots/${pot.id}/deposits`,'POST','{"amount":100}')
  await write(context,'recurring-payments','POST',`{"name":"Gym","categoryId":${category.id},"type":"SUBSCRIPTION","amount":25,"firstDueDate":"2027-03-20"}`)
  for(const width of [1280,768,390]) {
    await page.setViewportSize({width,height:900})
    for(const route of ['/finance','/finance/budgets','/finance/transactions','/finance/recurring-bills']) {
      await page.goto(route)
      await expect(page.getByRole('button',{name:'Logout',exact:true})).toBeVisible()
      expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      if(route === '/finance') {
        await expect(page.locator('a[href="/finance/pots"]').filter({hasText:'See Details'})).toBeVisible()
        await expect(page.locator('a[href="/finance/budgets"]').filter({hasText:'See Details'})).toBeVisible()
      }
      if(route === '/finance/budgets') await expect(page.getByText('Lunch',{exact:true})).toBeVisible()
      if(route === '/finance/recurring-bills') {
        const total=page.locator('article').filter({has:page.getByText('Total Bills',{exact:true})}).first()
        await expect(total).toHaveCSS('background-color','rgb(32, 31, 36)')
        await expect(total.locator('svg')).toBeVisible()
      }
      if(route === '/finance/transactions' || route === '/finance/recurring-bills') {
        const search=page.getByRole('textbox',{name:route === '/finance/transactions' ? 'Search transactions' : 'Search bills',exact:true})
        await expect(search).toHaveAttribute('placeholder',route === '/finance/transactions' ? 'Search transaction' : 'Search bills')
        const searchBox=(await search.boundingBox())!,sortBox=(await page.getByRole(width >= 768 ? 'combobox' : 'button',{name:'Sort By',exact:true}).boundingBox())!
        expect(Math.abs(searchBox.y+searchBox.height/2-sortBox.y-sortBox.height/2)).toBeLessThan(5)
      }
      await page.clock.runFor(2500)
      await page.screenshot({path:test.info().outputPath(`restored-${route.split('/').pop() || 'overview'}-${width}.png`),fullPage:true,animations:'disabled'})
    }
    await page.goto('/finance/pots')
    const card=page.locator('article').filter({has:page.getByRole('heading',{name:'Holiday',exact:true})})
    for(const [button,label,total,percentage] of [['+Add Money','Amount to Add','$110.50','55.25'],['Withdraw','Amount to Withdraw','$89.50','44.75']]) {
      await card.getByRole('button',{name:button,exact:true}).click()
      const dialog=page.getByRole('dialog')
      await dialog.getByLabel(label,{exact:true}).fill('10.50')
      await expect(dialog.getByText(total,{exact:true})).toBeVisible()
      await expect(dialog.getByRole('progressbar')).toHaveAttribute('aria-valuenow',percentage)
      await expect(dialog.getByRole('progressbar')).toHaveAttribute('aria-valuetext',total)
      const box=(await dialog.boundingBox())!
      expect(box.width).toBeLessThanOrEqual(width-32)
      await page.screenshot({path:test.info().outputPath(`restored-${button === 'Withdraw' ? 'withdrawal' : 'deposit'}-${width}.png`),animations:'disabled'})
      await page.keyboard.press('Escape')
    }
    const stored=await(await context.request.get(origin+`/api/finance/savings-pots/${pot.id}`)).json()
    expect(stored.balance).toBe(100)
  }
})

test('category table supports duplicate names, exact row selection, validation and history dependencies',async({page,context})=>{
  await account(context)
  await page.goto('/finance/categories')
  await expect(page.getByText('No categories yet.',{exact:true})).toBeVisible()
  await page.getByRole('button',{name:'+ Add category',exact:true}).click()
  await page.getByRole('dialog').getByLabel('Name',{exact:true}).fill('   ')
  await page.getByRole('dialog').getByRole('button',{name:'Save',exact:true}).click()
  await expect(page.getByRole('dialog').getByLabel('Name',{exact:true})).toHaveAttribute('aria-invalid','true')
  await page.getByRole('dialog').getByLabel('Name',{exact:true}).fill('Bills');await save(page)
  await category(page,'Bills')
  const rows=page.locator('tbody tr')
  await expect(rows).toHaveCount(2)
  await menu(page,rows.nth(1),'Edit')
  await expect(page.getByRole('dialog').getByLabel('Name',{exact:true})).toHaveValue('Bills')
  await page.getByRole('dialog').getByLabel('Name',{exact:true}).fill('Personal');await save(page)
  await expect(rows.nth(0)).toContainText('Bills');await expect(rows.nth(1)).toContainText('Personal')
  const cats=await(await context.request.get(origin+'/api/finance/categories')).text()
  const id=JSON.parse(cats).items[0].id
  expect((await write(context,'budgets','POST',`{"categoryId":${id},"spendingLimit":50,"color":"#ABCDEF"}`)).status()).toBe(201)
  await page.reload();await menu(page,rows.nth(0),'Delete')
  await page.getByRole('dialog').getByRole('button',{name:'Yes, Confirm Deletion',exact:true}).click()
  const review = page.getByRole('button', {name:'Review draft'})
  await review.click()
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('used by a budget')
  await page.keyboard.press('Escape')
  await expect(review).toBeFocused()
  await context.addCookies([{name:'finance-language',value:'es',url:origin}]);await page.reload()
  await expect(page.getByRole('heading',{name:'Categorías',exact:true})).toBeVisible()
  await expect(rows.nth(0)).toContainText('Bills')
})

test('subscription intervals are preserved in forms, scheduled months and translated labels',async({page,context})=>{
  test.setTimeout(120_000)
  await account(context)
  const cat=await(await write(context,'categories','POST','{"name":"Subscriptions"}')).json()
  await page.goto('/finance/recurring-bills')
  await expect(page.getByRole('button',{name:'Logout',exact:true})).toBeEnabled()
  await page.getByRole('button',{name:'+ Add recurring payment',exact:true}).click()
  const dialog=page.getByRole('dialog')
  await expect(dialog.getByRole('combobox',{name:'Frequency',exact:true})).toContainText('Every month')
  await dialog.getByLabel('Name',{exact:true}).fill('Quarterly service')
  await choose(page,'Category','Subscriptions')
  await dialog.getByRole('combobox',{name:'Frequency',exact:true}).click()
  await expect(page.getByRole('option')).toHaveCount(12)
  await page.getByRole('option',{name:'Every 3 months',exact:true}).click()
  await dialog.getByLabel('Per payment',{exact:true}).fill('30')
  await dialog.getByRole('button',{name:'Open calendar · First due date'}).click()
  const picker = page.getByRole('dialog',{name:'First due date',exact:true})
  await picker.getByRole('combobox',{name:'Choose the Year'}).selectOption('2027')
  await picker.getByRole('combobox',{name:'Choose the Month'}).selectOption('0')
  await picker.getByRole('button',{name:/January 31.*2027/}).click()
  const created=page.waitForRequest(request=>request.url() === origin+'/api/finance/recurring-payments' && request.method() === 'POST')
  await save(page)
  expect((await created).postDataJSON()).toMatchObject({categoryId:cat.id,intervalMonths:3,amount:30,type:'SUBSCRIPTION',firstDueDate:'2027-01-31'})
  const bill=page.locator('article').filter({has:page.getByRole('heading',{name:'Quarterly service',exact:true})})
  const total=page.locator('article').filter({has:page.getByText('Total Bills',{exact:true})}).first()
  await page.goto('/finance/recurring-bills?month=2027-04')
  await expect(bill.locator('time:visible')).toHaveAttribute('dateTime','2027-04-30')
  await expect(bill.locator('time:visible')).toContainText('Every 3 months')
  await expect(total).toContainText('$30.00')
  await menu(page,bill,'Mark paid');await save(page)
  await menu(page,bill,'Edit')
  await expect(dialog.getByRole('combobox',{name:'Frequency',exact:true})).toContainText('Every 3 months')
  await choose(page,'Frequency','Every 12 months')
  await save(page)
  await expect(bill.locator('time:visible').locator('..')).toContainText('Paid')
  await expect(total).toContainText('$30.00')
  await page.goto('/finance/recurring-bills?month=2027-05')
  await expect(bill).toHaveCount(0)
  await expect(total).toContainText('$0.00')
  await page.goto('/finance/recurring-bills?month=2028-01')
  await expect(bill.locator('time:visible')).toHaveAttribute('dateTime','2028-01-31')
  await expect(bill.locator('time:visible')).toContainText('Every 12 months')
  await context.addCookies([{name:'finance-language',value:'es',url:origin}]);await page.reload()
  await expect(page.getByRole('button',{name:'Cerrar sesión',exact:true})).toBeEnabled()
  await expect(bill.locator('time:visible')).toContainText('Cada 12 meses')
  await bill.getByRole('button',{name:/^Acciones:/}).click()
  await page.getByRole('menuitem',{name:'Editar',exact:true}).click()
  await expect(dialog.getByRole('combobox',{name:'Frecuencia',exact:true})).toContainText('Cada 12 meses')
  await page.setViewportSize({width:390,height:844})
  const openCalendar = dialog.getByRole('button',{name:'Abrir calendario · Primera fecha de vencimiento'})
  await openCalendar.press('Enter')
  const spanishPicker = page.getByRole('dialog',{name:'Primera fecha de vencimiento',exact:true})
  await expect(spanishPicker.getByRole('combobox',{name:'Elegir el mes'})).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(openCalendar).toBeFocused()
  await choose(page,'Tipo de pago','Compra a plazos')
  await expect(dialog.getByRole('combobox',{name:'Frecuencia',exact:true})).toHaveCount(0)
  await dialog.getByLabel('Número de cuotas',{exact:true}).fill('2')
  const converted=page.waitForRequest(request=>request.url().startsWith(origin+'/api/finance/recurring-payments/') && request.method() === 'PUT')
  await save(page)
  expect((await converted).postDataJSON()).toMatchObject({intervalMonths:1,totalInstallments:2,type:'INSTALLMENT',amount:30})
})

test('Overview month updates all cards and stays local when opening recurring bills', async ({page,context}) => {
  await account(context)
  const category = await (await write(context,'categories','POST','{"name":"Travel"}')).json()
  const seed = async (path:string, body:object, method='POST') => {
    expect((await write(context,path,method,JSON.stringify(body))).ok()).toBe(true)
  }
  await seed('financial-summary/settings',{frequency:'MONTHLY',startDay:7},'PUT')
  await seed('transactions',{name:'February refund',categoryId:category.id,transactionDate:'2027-02-01',amount:75})
  await seed('transactions',{name:'February ticket',categoryId:category.id,transactionDate:'2027-02-28',amount:-10})
  await seed('budgets',{categoryId:category.id,spendingLimit:100,color:'#277C78'})
  const pot = await (await write(context,'savings-pots','POST','{"name":"Trip","targetAmount":100,"color":"#277C78"}')).json()
  await seed(`savings-pots/${pot.id}/deposits`,{amount:25})
  await seed('recurring-payments',{name:'March pass',categoryId:category.id,firstDueDate:'2027-03-21',amount:5,type:'SUBSCRIPTION'})

  await page.goto('/finance')
  const main = page.getByRole('main')
  const monthField = main.getByLabel('Month',{exact:true})
  const card = (heading:string) => main.locator('article').filter({has:page.getByRole('heading',{name:heading,exact:true})}).last()
  await expect(main).toContainText('07 Mar 2027')
  await expect(card('Total Saved')).toContainText('$25.00')
  await expect(card('Total Upcoming')).toContainText('$5.00')
  const reads = new Map<string,URLSearchParams>()
  page.on('request', request => {
    const url = new URL(request.url())
    if(url.pathname.startsWith('/api/finance/') && url.searchParams.has('month')) reads.set(url.pathname.slice('/api/finance/'.length),url.searchParams)
  })
  await expect(main.locator('[inert]')).toHaveCount(0)
  await main.getByRole('button',{name:'Open calendar · Month'}).click()
  const picker = page.getByRole('dialog',{name:'Month',exact:true})
  await picker.getByRole('combobox',{name:'Choose the Year'}).selectOption('2027')
  await picker.getByRole('combobox',{name:'Choose the Month'}).selectOption('0')
  await picker.getByRole('combobox',{name:'Choose the Month'}).selectOption('1')
  await expect(monthField).toHaveValue('')
  await expect(main).toContainText('Reporting period: 07 Mar 2027')
  expect(reads.size).toBe(0)
  await picker.getByRole('button',{name:'Select month'}).click()
  await expect(main).toContainText('Period for February 2027: 01 Feb 2027 – 28 Feb 2027')
  await expect(card('Net balance')).toContainText('$65.00')
  await expect(card('Income')).toContainText('$75.00')
  await expect(card('Expenses')).toContainText('$10.00')
  await expect(card('Transactions')).toContainText('February ticket')
  await expect(card('Transactions')).not.toContainText('Trip')
  await expect(card('Pots')).not.toContainText('$25.00')
  await expect(card('Total Saved')).toContainText('$0.00')
  await expect(card('Budgets')).toContainText('$10.00')
  await expect(card('Total Upcoming')).toContainText('$0.00')
  expect([...reads.keys()].sort()).toEqual(['budgets','financial-summary','recurring-payments/summary','savings-pots','transactions'])
  for (const query of reads.values()) expect(query.get('month')).toBe('2027-02')
  expect(Object.fromEntries(reads.get('transactions')!)).toEqual({sort:'newest',size:'4',page:'0',month:'2027-02'})
  await expect(page).toHaveURL(origin+'/finance')
  await main.getByRole('button',{name:'Back to current period'}).click()
  await expect(monthField).toHaveValue('')
  await expect(main).toContainText('Reporting period: 07 Mar 2027')
  await expect(card('Total Saved')).toContainText('$25.00')
  await monthField.fill('2027-02')
  await expect(card('Total Upcoming')).toContainText('$0.00')
  await card('Recurring Bills').getByRole('link',{name:'See Details'}).click()
  await expect(page).toHaveURL(origin+'/finance/recurring-bills')
  await expect(main.getByLabel('Month',{exact:true})).toHaveValue('2027-03')
  await expect(main).toContainText('March pass')
})

test('Spanish Overview identifies the selected period even if the server ignores the month',async({page,context})=>{
  await account(context,'es')
  await page.goto('/finance')
  const main=page.getByRole('main')
  await expect(main).toContainText('Periodo del resumen')
  await expect(main.locator('[inert]')).toHaveCount(0)
  await page.route('**/api/finance/financial-summary?month=2024-02',route=>route.fulfill({
    json:{periodStart:'2027-03-01',periodEnd:'2027-03-31',income:10,expenses:0,currentBalance:10},
  }))
  await main.getByLabel('Mes',{exact:true}).fill('2024-02')
  await expect(main).toContainText(/Corte de febrero de 2024: 01 feb.*29 feb/)
  await expect(main.getByRole('alert')).toContainText('El servidor devolvió un corte distinto')
  await expect(main.getByRole('heading',{name:'Saldo neto'})).toHaveCount(0)
  await page.unroute('**/api/finance/financial-summary?month=2024-02')
  await main.getByRole('button',{name:'Recargar datos'}).click()
  await expect(main.getByRole('heading',{name:'Saldo neto'})).toBeVisible()
  await expect(main.getByRole('alert')).toHaveCount(0)
})

test('complete financial flow refreshes sections and overview with server data',async({page,context})=>{
  test.setTimeout(120_000)
  await account(context);await page.goto('/finance/categories');await category(page,'Personal')
  await page.goto('/finance/budgets');await page.getByRole('button',{name:'+ Add New Budget',exact:true}).click()
  await choose(page,'Category','Personal');await page.getByRole('dialog').getByLabel('Maximum Spending',{exact:true}).fill('40');await save(page)
  await page.goto('/finance/transactions')
  await page.clock.setFixedTime(await page.evaluate(() => new Date(2027, 2, 20, 12).getTime()))
  await page.getByRole('button',{name:'+ Add transaction',exact:true}).click()
  await page.getByRole('dialog').getByLabel('Name',{exact:true}).fill('Groceries recorded')
  await expect(page.getByRole('dialog').getByLabel('Transaction Date',{exact:true})).toHaveValue('2027-03-20')
  await choose(page,'Category','Personal');await page.getByRole('dialog').getByLabel('Amount',{exact:true}).fill('50.25');await save(page)
  await expect(page.locator('.Toastify__toast').filter({hasText:'Budget limit reached.'})).toBeVisible()
  await page.goto('/finance/budgets');await expect(page.locator('main')).toContainText('-$10.25')
  await page.getByRole('link',{name:'See All',exact:true}).click();await expect(page).toHaveURL(/category=\d+/)
  await expect(page.locator('main')).toContainText('Groceries recorded')
  await page.goto('/finance/pots');await page.getByRole('button',{name:'+ Add New Pot',exact:true}).click()
  await page.getByRole('dialog').getByLabel('Pot Name',{exact:true}).fill('Rain fund');await page.getByRole('dialog').getByLabel('Target',{exact:true}).fill('100');await save(page)
  let pot=page.locator('article').filter({has:page.getByRole('heading',{name:'Rain fund',exact:true})})
  await pot.getByRole('button',{name:'+Add Money',exact:true}).click();await page.getByRole('dialog').getByLabel('Amount to Add',{exact:true}).fill('120.50');await save(page)
  await expect(pot).toContainText('$120.50');await expect(pot.getByRole('progressbar')).toHaveAttribute('value','100')
  await pot.getByRole('button',{name:'Withdraw',exact:true}).click();await page.getByRole('dialog').getByLabel('Amount to Withdraw',{exact:true}).fill('20.25');await save(page)
  await expect(pot).toContainText('$100.25')
  await menu(page,pot,'Delete');await save(page);await expect(pot).toHaveCount(0)
  await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(pot).toBeVisible();await expect(pot).toContainText('$100.25')
  await page.goto('/finance/recurring-bills');await page.getByRole('button',{name:'+ Add recurring payment',exact:true}).click()
  await page.getByRole('dialog').getByLabel('Name',{exact:true}).fill('Hosting');await choose(page,'Category','Personal');await page.getByRole('dialog').getByLabel('Per payment',{exact:true}).fill('25.10');await page.getByRole('dialog').getByLabel('First due date',{exact:true}).fill('2027-03-25');await save(page)
  const payment=page.locator('article').filter({has:page.getByText('Hosting',{exact:true})}).last()
  await menu(page,payment,'Mark paid');await save(page);await expect(payment).toContainText('Paid')
  await page.goto('/finance');await expect(page.locator('main')).toContainText('Hosting');await expect(page.locator('main')).toContainText('Rain fund');await expect(page.locator('main')).toContainText('Groceries recorded')
  await page.getByRole('button',{name:'Configure period',exact:true}).click();await choose(page,'Frequency','Semimonthly');await page.getByRole('dialog').getByLabel('Start day',{exact:true}).fill('4');await save(page)
  await expect(page.locator('main')).toContainText('19 Mar 2027')
})

test('transactions use global filters and stable pages while editing linked movements',async({page,context})=>{
  await account(context)
  const cat=await(await write(context,'categories','POST','{"name":"History"}')).json(),other=await(await write(context,'categories','POST','{"name":"Other"}')).json()
  for(let i=0;i<7;i++)expect((await write(context,'transactions','POST',`{"name":"Matching ${i}","categoryId":${cat.id},"transactionDate":"2027-03-20","amount":-1}`)).status()).toBe(201)
  await write(context,'transactions','POST',`{"name":"Excluded","categoryId":${other.id},"transactionDate":"2027-03-20","amount":-1}`)
  await page.goto('/finance/categories')
  await page.goto(`/finance/transactions?category=${cat.id}&query=Matching&page=999`)
  await expect(page).toHaveURL(/query=Matching&page=2$/)
  await page.goBack()
  await expect(page).toHaveURL('/finance/categories')
  await page.goForward()
  await expect(page).toHaveURL(/query=Matching&page=2$/)
  await expect(page.locator('main')).toContainText('Matching 2');await expect(page.locator('main')).not.toContainText('Excluded')
  await expect(page.getByRole('link',{name:'Go to next page',exact:true})).toHaveAttribute('aria-disabled','true')
  const row=page.locator('article').filter({has:page.getByText('Matching 2',{exact:true})})
  await menu(page,row,'Edit');await page.getByRole('dialog').getByLabel('Name',{exact:true}).fill('Corrected');await save(page)
  await page.goto(`/finance/transactions?category=${cat.id}&query=Corrected`);await expect(page.locator('main')).toContainText('Corrected')
  await page.goto('/finance/transactions?category=History');await expect(page).not.toHaveURL(/category=History/)
  await write(context,`categories/${cat.id}`,'DELETE')
  await page.goto(`/finance/transactions?category=${cat.id}&query=Corrected`)
  await expect(page.locator('main')).toContainText('Corrected')
  const edited=page.locator('article').filter({has:page.getByText('Corrected',{exact:true})})
  await menu(page,edited,'Edit')
  const editor = page.getByRole('dialog')
  await expect(editor.getByText('Manual',{exact:true})).toBeVisible()
  await editor.getByLabel('Amount',{exact:true}).fill('2')
  const update = page.waitForRequest(request => request.method() === 'PUT' && request.url().includes('/api/finance/transactions/'))
  await save(page)
  expect(Object.keys((await update).postDataJSON()).sort()).toEqual(['amount','categoryId','name','transactionDate'])
  await expect(edited).toContainText('-$2.00')
})

test('exact IDs and amounts survive SSR, selectors, edits and aggregate rendering',async({page,context})=>{
  await account(context);await control(context,'next-id',{id:'9007199254740993'})
  const cat=await write(context,'categories','POST','{"name":"Bills"}')
  expect(await cat.text()).toContain('9007199254740993')
  expect((await write(context,'transactions','POST','{"name":"Exact record","categoryId":9007199254740993,"transactionDate":"2027-03-20","amount":-99999999999999999.99}')).status()).toBe(201)
  const html=await(await context.request.get(origin+'/finance/transactions')).text()
  expect(html).toContain('99999999999999999.99')
  await page.goto('/finance/transactions')
  const row=page.locator('article').filter({has:page.getByText('Exact record',{exact:true})})
  await expect(row).toContainText('-$99,999,999,999,999,999.99');await menu(page,row,'Edit')
  await expect(page.getByRole('dialog').getByLabel('Amount',{exact:true})).toHaveValue('99999999999999999.99')
  await save(page)
  for(const name of ['One','Two']) {
    const created=await write(context,'savings-pots','POST',`{"name":"${name}","targetAmount":99999999999999999.99,"color":"#ABCDEF"}`)
    const id=/"id":(\d+)/.exec(await created.text())![1]
    expect((await write(context,`savings-pots/${id}/deposits`,'POST','{"amount":99999999999999999.99}')).status()).toBe(200)
  }
  await page.goto('/finance');await expect(page.locator('main')).toContainText('$199,999,999,999,999,999.98')
  await page.goto('/finance/pots');const pot=page.locator('article').filter({has:page.getByRole('heading',{name:'One',exact:true})})
  await menu(page,pot,'Edit');await expect(page.getByRole('dialog').getByRole('combobox',{name:'Color Tag',exact:true})).toContainText('#ABCDEF')
  await save(page)
})

test('lost mutation responses are not replayed and guest mode never calls finance services',async({page,context})=>{
  await account(context);await page.goto('/finance/categories')
  let submissions=0
  await page.route('**/api/finance/categories',async route=>{
    if(route.request().method() === 'POST'){submissions++;await route.fetch();await route.abort()}
    else await route.continue()
  })
  await page.getByRole('button',{name:'+ Add category',exact:true}).click();await page.getByRole('dialog').getByLabel('Name',{exact:true}).fill('Saved once')
  await page.getByRole('dialog').getByRole('button',{name:'Save',exact:true}).click()
  await expect(page.getByRole('alert').filter({hasText:'result is uncertain'})).toBeVisible()
  await page.getByRole('button',{name:'Verify',exact:true}).click()
  await expect(page.locator('tbody tr')).toHaveCount(1);expect(submissions).toBe(1)
  await page.getByRole('button',{name:'Logout',exact:true}).click();await expect(page).toHaveURL('/login')
  await page.getByRole('button',{name:'Continue as guest',exact:true}).click()
  await expect(page).toHaveURL('/finance')
  await expect(page.getByRole('button',{name:'Logout',exact:true})).toBeVisible()
  let requests=0;page.on('request',request=>{if(request.url().includes('/api/finance/'))requests++})
  for(const route of ['','/categories','/transactions','/budgets','/pots','/recurring-bills'])await page.goto('/finance'+route)
  expect(requests).toBe(0)
})

test('an idle account waits for a user change before refreshing its data', async ({page,context}) => {
  await account(context)
  await page.clock.install()
  await page.goto('/finance/categories')
  await expect(page.getByText('No categories yet.',{exact:true})).toBeVisible()
  await expect(page.locator('main [inert]')).toHaveCount(0)
  const requests: string[] = []
  page.on('request', request => {
    if (request.url().includes('/api/finance/')) requests.push(request.method())
  })
  await page.clock.fastForward(180_000)
  expect(requests).toEqual([])
  await category(page,'Food')
  await expect(page.locator('tbody tr')).toContainText('Food')
  await expect.poll(() => requests).toEqual(['POST','GET'])
})

test('linked corrections update pot balances, VOID payments and server conflicts',async({page,context})=>{
  test.setTimeout(120_000)
  await account(context)
  const cat=await(await write(context,'categories','POST','{"name":"Linked"}')).json()
  const pot=await(await write(context,'savings-pots','POST','{"name":"Linked pot","targetAmount":100,"color":"#277C78"}')).json()
  await write(context,`savings-pots/${pot.id}/deposits`,'POST','{"amount":100}')
  await write(context,`savings-pots/${pot.id}/withdrawals`,'POST','{"amount":20}')
  await page.goto('/finance/transactions')
  let row=page.locator('article').filter({hasText:'Linked pot'}).filter({hasText:'-$20.00'})
  await menu(page,row,'Edit');await expect(page.getByRole('dialog').getByRole('combobox',{name:'Category',exact:true})).toContainText('No category')
  await expect(page.getByRole('dialog').getByText('Pot movement · Linked pot',{exact:true})).toBeVisible()
  await page.getByRole('dialog').getByLabel('Amount',{exact:true}).fill('25');await save(page)
  await page.goto('/finance/pots');await expect(page.locator('main')).toContainText('$75.00')
  await page.goto('/finance/transactions');row=page.locator('article').filter({hasText:'Linked pot'}).filter({hasText:'+$100.00'})
  await menu(page,row,'Edit');await page.getByRole('dialog').getByLabel('Amount',{exact:true}).fill('10')
  await page.getByRole('dialog').getByRole('button',{name:'Save',exact:true}).click()
  await page.getByRole('button', {name:'Review draft'}).click()
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('conflicts');await expect(page.getByRole('dialog').getByLabel('Amount',{exact:true})).toHaveValue('10');await page.keyboard.press('Escape')
  const recurring=await(await write(context,'recurring-payments','POST',`{"name":"Linked recurring","categoryId":${cat.id},"type":"INSTALLMENT","amount":10,"firstDueDate":"2027-01-31","totalInstallments":12}`)).json()
  await write(context,`recurring-payments/${recurring.id}/payments/2027-03`,'PUT')
  await page.goto('/finance/transactions?query=Linked+recurring');row=page.locator('article').filter({has:page.getByText('Linked recurring',{exact:true})})
  await menu(page,row,'Edit')
  await expect(page.getByRole('dialog').getByText('Recurring payment',{exact:true})).toBeVisible()
  await page.getByRole('dialog').getByLabel('Name',{exact:true}).fill('Corrected refund');await choose(page,'Transaction type','Income');await save(page)
  await page.goto('/finance/recurring-bills');const bill=page.locator('article').filter({has:page.getByText('Linked recurring',{exact:true})}).last()
  await expect(bill).toContainText('Void');await expect(bill).toContainText('Installment 3/12');await expect(bill).toContainText('Paid installments: 0')
  await expect(bill.getByText('Installment 3/12 · Paid: $0.00 of $120.00')).toBeVisible()
  await menu(page,bill,'Mark paid');await save(page);await expect(bill).toContainText('Paid installments: 1')
  await expect(bill.getByText('Installment 3/12 · Paid: $10.00 of $120.00')).toBeVisible()
  await page.goto('/finance/transactions?query=Corrected+refund');row=page.locator('article').filter({has:page.getByText('Corrected refund',{exact:true})})
  await menu(page,row,'Edit');await choose(page,'Transaction type','Expense');await page.getByRole('dialog').getByRole('button',{name:'Save',exact:true}).click()
  await page.getByRole('button', {name:'Review draft'}).click()
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('conflicts');await page.keyboard.press('Escape')
  await page.goto('/finance/recurring-bills');await menu(page,bill,'Edit');await page.getByRole('dialog').getByLabel('First due date',{exact:true}).fill('2027-02-28');await page.getByRole('dialog').getByRole('button',{name:'Save',exact:true}).click()
  await page.getByRole('button', {name:'Review draft'}).click()
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('conflicts')
})

test('renaming and deleting categories refresh all dependent labels without deleting history',async({page,context})=>{
  await account(context)
  const cat=await(await write(context,'categories','POST','{"name":"Original"}')).json()
  const budget=await(await write(context,'budgets','POST',`{"categoryId":${cat.id},"spendingLimit":10,"color":"#277C78"}`)).json()
  const bill=await(await write(context,'recurring-payments','POST',`{"name":"History payment","categoryId":${cat.id},"type":"SUBSCRIPTION","amount":1,"firstDueDate":"2027-03-20"}`)).json()
  await write(context,'transactions','POST',`{"name":"History expense","categoryId":${cat.id},"transactionDate":"2027-03-20","amount":-2}`)
  await page.goto('/finance/categories');await menu(page,page.locator('tbody tr'),'Edit')
  await page.getByRole('dialog').getByLabel('Name',{exact:true}).fill('Renamed');await save(page)
  for(const route of ['transactions','budgets','recurring-bills']){await page.goto('/finance/'+route);await expect(page.locator('main')).toContainText('Renamed');await expect(page.locator('main')).not.toContainText('Original')}
  await write(context,`budgets/${budget.id}`,'DELETE');await write(context,`recurring-payments/${bill.id}`,'DELETE')
  await page.goto('/finance/categories');await menu(page,page.locator('tbody tr'),'Delete');await save(page)
  await expect(page.getByText('No categories yet.',{exact:true})).toBeVisible()
  await page.goto(`/finance/transactions?category=${cat.id}`);await expect(page.locator('main')).toContainText('History expense');await expect(page.locator('main')).toContainText('Renamed')
})

test('account data stays private across sessions, live layouts and languages',async({browser})=>{
  test.setTimeout(120_000)
  const a=await browser.newContext(),b=await browser.newContext()
  try {
    await account(a);await account(b)
    const cat=await(await write(a,'categories','POST','{"name":"Bills"}')).json()
    await write(a,'transactions','POST',`{"name":"Private A record","categoryId":${cat.id},"transactionDate":"2027-03-20","amount":-12.34}`)
    await write(a,'budgets','POST',`{"categoryId":${cat.id},"spendingLimit":10,"color":"#ABCDEF"}`)
    await write(a,'savings-pots','POST','{"name":"Visible pot","targetAmount":20,"color":"#ABCDEF"}')
    const page=await a.newPage()
    for(const width of [320,768,1280])for(const language of ['en','es']) {
      await page.setViewportSize({width,height:900});await a.addCookies([{name:'finance-language',value:language,url:origin}])
      for(const route of ['','/categories','/transactions','/budgets','/pots','/recurring-bills']) {
        await page.goto('/finance'+route)
        await expect(page.locator('html')).toHaveAttribute('lang',language)
        expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
        await expect(page.locator('main')).not.toContainText('USD')
        if(route === '/categories')await expect(page.locator('tbody tr')).toContainText('Bills')
      }
      if(width === 320 && language === 'es') {
        await page.goto('/finance/categories');await page.getByRole('button',{name:'+ Agregar categoría',exact:true}).click()
        const box=await page.getByRole('dialog').boundingBox();expect(box!.width).toBeLessThanOrEqual(320)
        await page.keyboard.press('Escape')
      }
    }
    await page.goto('/finance/categories');await page.screenshot({path:'test-results/live-categories-desktop.png',fullPage:true})
    const other=await b.newPage();await other.goto('/finance/transactions')
    await expect(other.locator('main')).not.toContainText('Private A record')
    const html=await(await b.request.get(origin+'/finance/transactions')).text();expect(html).not.toContain('Private A record')
    await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click();await expect(page).toHaveURL('/login');await page.goBack();await page.goto('/finance/transactions');await expect(page).toHaveURL(/\/login/)
  } finally {await a.close();await b.close()}
})

test('logout cancels late private reads and a financial 401 returns to login',async({page,context})=>{
  await account(context)
  await write(context,'categories','POST','{"name":"Private late response"}')
  await page.goto('/finance/categories');await expect(page.locator('tbody tr')).toContainText('Private late response')
  await page.getByRole('button',{name:'+ Add category',exact:true}).click()
  await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape')
  let release!:()=>void,started!:()=>void,hold=true
  const pending=new Promise<void>(resolve=>{release=resolve}),requested=new Promise<void>(resolve=>{started=resolve})
  await page.route('**/api/finance/categories',async route=>{
    if(hold && route.request().method() === 'GET') {
      hold=false
      const response=await route.fetch();started();await pending
      await route.fulfill({response}).catch(()=>{})
    } else await route.continue()
  })
  await category(page,'Pending update')
  await requested
  await page.getByRole('button',{name:'Logout',exact:true}).click();await expect(page).toHaveURL('/login')
  await account(context)
  const checked=page.waitForResponse(response=>response.url() === origin+'/api/auth/me' && response.status() === 200)
  await page.goto('/finance/categories');await checked;release()
  await expect(page.getByText('No categories yet.',{exact:true})).toBeVisible()
  await expect(page.locator('main')).not.toContainText('Private late response')
  await page.getByRole('button',{name:'+ Add category',exact:true}).click()
  await page.getByRole('dialog').getByLabel('Name',{exact:true}).fill('Expired submission')
  const cookie=(await context.cookies()).find(item=>item.name === 'JSESSIONID')!
  expect((await context.request.post(upstream+'/__expire',{headers:{Cookie:`JSESSIONID=${cookie.value}`}})).status()).toBe(204)
  await page.getByRole('dialog').getByRole('button',{name:'Save',exact:true}).click()
  await expect(page).toHaveURL(/\/login\?next=/)
  expect((await context.cookies()).find(item=>item.name === 'finance-guest')).toBeUndefined()
})

test('all finance sections change before held reads and restore history', async ({page, context}) => {
  await account(context)
  const pot = await write(context, 'savings-pots', 'POST', '{"name":"Cached trip","targetAmount":100,"color":"#277C78"}')
  expect(pot.status()).toBe(201)
  await page.goto('/finance/pots')
  await expect(page.getByRole('heading', {name:'Cached trip'})).toBeVisible()
  await expect(page.locator('main [inert]')).toHaveCount(0)
  await page.clock.install()
  const gate = Promise.withResolvers<void>()
  let potReads = 0
  await page.route('**/api/finance/**', async route => {
    if (new URL(route.request().url()).pathname === '/api/finance/savings-pots') potReads++
    await gate.promise
    await route.continue().catch(() => {})
  })
  await page.route('**/api/auth/me', async route => {
    await gate.promise
    await route.continue().catch(() => {})
  })
  try {
    for (const width of [390, 1280]) {
      await page.setViewportSize({width, height:850})
      for (const [section, path] of [
        ['Overview', '/finance'], ['Transactions', '/finance/transactions'],
        ['Categories', '/finance/categories'], ['Budgets', '/finance/budgets'],
        ['Recurring bills', '/finance/recurring-bills'], ['Pots', '/finance/pots'],
      ]) {
        const link = page.getByRole('link', {name:section, exact:true})
        await link.press('Enter')
        await expect(page).toHaveURL(path)
        await expect(link).toHaveAttribute('aria-current', 'page')
        await expect(page.getByRole('heading', {name:section === 'Recurring bills' ? 'Recurring Bills' : section, exact:true})).toBeFocused()
        if (path === '/finance/categories') await page.clock.fastForward(600_000)
      }
      await expect(page.getByRole('heading', {name:'Cached trip'})).toBeVisible()
      expect(potReads).toBe(0)
      // The network is still held. pushState history entries share the current document.
      await page.evaluate(() => history.back())
      await expect(page).toHaveURL('/finance/recurring-bills')
      await page.evaluate(() => history.forward())
      await expect(page).toHaveURL('/finance/pots')
    }
  } finally { gate.resolve() }
})



test('authorized HTML starts streaming while the first financial read is held', async ({context}) => {
  await account(context)
  await control(context, 'next-id', {id:'9007199254740993'})
  await write(context, 'categories', 'POST', '{"name":"Streamed financial record"}')
  const session = (await context.cookies()).find(cookie => cookie.name === 'JSESSIONID')!
  const headers = { Cookie: 'JSESSIONID=' + session.value }
  expect((await context.request.post(upstream + '/__hold-categories', {headers})).status()).toBe(204)
  const response = await fetch(origin + '/finance/categories', {headers, signal: AbortSignal.timeout(12000)})
  const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader()
  let html = ''
  try {
    while (!html.includes('<h1')) {
      const chunk = await reader.read()
      if (chunk.done) break
      html += chunk.value
    }
    expect(html).toMatch(/<h1[^>]*>Categories<\/h1>/)
    expect(html).not.toContain('Streamed financial record')
  } finally {
    await context.request.post(upstream + '/__release-categories', {headers})
  }
  for (;;) {
    const chunk = await reader.read()
    if (chunk.done) break
    html += chunk.value
  }
  expect(html).toContain('Streamed financial record')
  expect(html).toContain('9007199254740993')
})

test('deposit remains pending across pages and confirms the linked movement once', async ({page, context}) => {
  await account(context)
  const pot = await (await write(context,'savings-pots','POST','{"name":"Travel","targetAmount":100,"color":"#277C78"}')).json()
  expect((await write(context, `savings-pots/${pot.id}/deposits`, 'POST', '{"amount":100}')).ok()).toBe(true)
  await page.goto('/finance/pots')
  const hold = Promise.withResolvers<void>()
  let writes = 0
  await page.route('**/api/finance/savings-pots/*/deposits', async route => {
    writes++
    await hold.promise
    await route.continue()
  })
  const card = page.locator('article').filter({has:page.getByRole('heading',{name:'Travel',exact:true})})
  await card.getByRole('button',{name:'+Add Money',exact:true}).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Amount to Add',{exact:true}).fill('25')
  await dialog.getByRole('button',{name:'Confirm Addition'}).click()
  try {
    await expect(dialog).toHaveCount(0)
    await expect(card).toContainText('$125.00')
    await page.getByRole('link',{name:'Overview',exact:true}).click()
    await expect(page.getByRole('heading',{name:'Overview',exact:true})).toBeVisible()
    await expect(page.getByRole('main')).toContainText('$125.00')
    expect(writes).toBe(1)
  } finally { hold.resolve() }
  await expect(page.getByText(/Travel · Pending confirmation/)).toHaveCount(0)
  await expect(page.getByRole('main')).toContainText('$125.00')
  await expect.poll(async () => (await (await context.request.get(origin + '/api/finance/savings-pots/' + pot.id)).json()).balance).toBe(125)
  expect(writes).toBe(1)
})

test('out-of-order category edits only undo the rejected projection', async ({page, context}) => {
  await account(context)
  const first = await (await write(context,'categories','POST','{"name":"Duplicate"}')).json()
  const second = await (await write(context,'categories','POST','{"name":"Duplicate"}')).json()
  await page.goto('/finance/categories')
  const response = Promise.withResolvers<void>()
  await page.route('**/api/finance/categories/' + first.id, async route => {
    await response.promise
    await route.fulfill({status:409})
  })
  const rows = page.locator('tbody tr')
  async function rename(id: number, value: string) {
    const row = rows.filter({has:page.getByRole('button', {name:new RegExp('#' + id + '\\)$')})})
    await menu(page,row,'Edit')
    await page.getByRole('dialog').getByLabel('Name',{exact:true}).fill(value)
    await page.getByRole('dialog').getByRole('button',{name:'Save',exact:true}).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  }
  try {
    await rename(first.id, 'Rejected name')
    await expect(rows.filter({hasText:'Rejected name'})).toBeVisible()
    await expect(rows.filter({hasText:'Duplicate'})).toHaveCount(1)
    await rename(second.id, 'Confirmed name')
    await expect(page.locator('.Toastify__toast').filter({hasText:'Saved.'})).toBeVisible()
    await expect(rows.filter({hasText:'Confirmed name'})).toBeVisible()
  } finally { response.resolve() }
  await expect(rows.filter({hasText:'Rejected name'})).toHaveCount(0)
  await expect(rows.filter({hasText:'Duplicate'})).toHaveCount(1)
  await expect(rows.filter({hasText:'Confirmed name'})).toBeVisible()
})

test('pot deletion can be undone from another section after confirmation', async ({page, context}) => {
  await account(context)
  const pot = await (await write(context,'savings-pots','POST','{"name":"Keep me","targetAmount":100,"color":"#277C78"}')).json()
  await page.goto('/finance/pots')
  const hold = Promise.withResolvers<void>()
  const restore = '**/api/finance/savings-pots/' + pot.id + '/restore'
  let restores = 0
  await page.route(restore, route => { restores++; return route.continue() })
  await page.route('**/api/finance/savings-pots/' + pot.id, async route => {
    if (route.request().method() === 'DELETE') await hold.promise
    await route.continue()
  })
  const card = page.locator('article').filter({has:page.getByRole('heading',{name:'Keep me',exact:true})})
  await menu(page,card,'Delete')
  await page.getByRole('button',{name:'Yes, Confirm Deletion'}).click()
  try {
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.getByRole('link',{name:'Categories',exact:true}).click()
    await expect(page.getByRole('heading',{name:'Categories'})).toBeVisible()
  } finally { hold.resolve() }
  await page.getByRole('button',{name:'Undo',exact:true}).click()
  await expect.poll(() => restores).toBe(1)
  await page.getByRole('link',{name:'Pots',exact:true}).click()
  await expect(card).toBeVisible()
  await expect(page.getByText(/Keep me · Pending confirmation/)).toHaveCount(0)
})

test('recording a recurring payment updates the bill during navigation', async ({page, context}) => {
  await account(context)
  const category = await (await write(context,'categories','POST','{"name":"Household"}')).json()
  const bill = await (await write(context,'recurring-payments','POST',
    `{"name":"Held subscription","categoryId":${category.id},"amount":12,"type":"SUBSCRIPTION","firstDueDate":"2027-03-01"}`)).json()
  await page.goto('/finance/recurring-bills')
  const hold = Promise.withResolvers<void>()
  let writes = 0
  await page.route('**/api/finance/recurring-payments/' + bill.id + '/payments/*', async route => {
    writes++
    await hold.promise
    await route.continue()
  })
  const row = page.locator('article').filter({has:page.getByRole('heading',{name:'Held subscription',exact:true})})
  await menu(page,row,'Mark paid')
  await page.getByRole('button',{name:'Confirm payment',exact:true}).click()
  try {
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(row.getByText('Paid', {exact:true})).toBeAttached()
    await expect(page.locator('article').filter({has:page.getByText('Paid Bills', {exact:true})})).toContainText('$12.00')
    await page.getByRole('link',{name:'Transactions',exact:true}).click()
    await expect(page.getByRole('heading',{name:'Transactions',exact:true})).toBeVisible()
    await expect(page.getByText('Held subscription',{exact:true})).toHaveCount(0)
  } finally { hold.resolve() }
  await expect(page.getByText('Held subscription',{exact:true})).toBeVisible()
  expect(writes).toBe(1)
})

test('Overview and Transactions share the same in-flight reads', async ({page, context}) => {
  await account(context)
  await page.goto('/finance/pots')
  await expect(page.getByText('No pots yet.', {exact:true})).toBeVisible()
  const hold = Promise.withResolvers<void>()
  const reads: string[] = []
  await page.route(/\/api\/finance\/(transactions|categories)(?:\?|$)/, async route => {
    const url = new URL(route.request().url())
    reads.push(url.pathname + url.search)
    await hold.promise
    await route.continue()
  })
  try {
    await page.getByRole('link',{name:'Overview',exact:true}).click()
    await expect.poll(() => reads.length).toBe(2)
    await page.getByRole('link',{name:'Transactions',exact:true}).click()
    await expect(page.getByRole('heading',{name:'Transactions',exact:true})).toBeFocused()
    await expect(page.getByText('Loading…',{exact:true}).first()).toBeAttached()
  } finally { hold.resolve() }
  await expect(page.getByText('Loading…',{exact:true})).toHaveCount(0)
  const urls = reads.map(value => new URL(value,origin))
  expect(urls.map(url => url.pathname).sort()).toEqual(['/api/finance/categories','/api/finance/transactions'])
  expect(urls.find(url => url.pathname.endsWith('/transactions'))!.searchParams.get('page')).toBe('0')
})

test('a filtered finance link opens natively in a new tab after local navigation', async ({page, context}) => {
  await account(context)
  const category = await (await write(context,'categories','POST','{"name":"Holiday"}')).json()
  await write(context,'budgets','POST',`{"categoryId":${category.id},"spendingLimit":30,"color":"#277C78"}`)
  await page.goto('/finance')
  await page.getByRole('link',{name:'Budgets',exact:true}).click()
  const detail = page.getByRole('link',{name:'See All',exact:true})
  const [next] = await Promise.all([context.waitForEvent('page'), detail.click({modifiers:['Control']})])
  await expect(next).toHaveURL('/finance/transactions?category=' + category.id)
  await expect(next.getByRole('combobox',{name:'Category',exact:true})).toContainText('Holiday')
  await expect(page).toHaveURL('/finance/budgets')
  await page.getByRole('combobox',{name:'Language',exact:true}).click()
  await page.getByRole('option',{name:'Español',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Presupuestos',exact:true})).toBeVisible()
  await expect(page).toHaveURL('/finance/budgets')
})

test('a confirmed write stays confirmed when refreshing its view fails', async ({page, context}) => {
  await account(context)
  await page.goto('/finance/categories')
  await expect(page.getByText('No categories yet.')).toBeVisible()
  let writes = 0
  let unavailable = true
  await page.route('**/api/finance/categories', route => {
    if (route.request().method() === 'POST') {
      writes++
      return route.continue()
    }
    return unavailable ? route.fulfill({status:503}) : route.continue()
  })
  await category(page,'Confirmed before refresh')
  await expect(page.locator('.Toastify__toast').filter({hasText:'Saved.'})).toBeVisible()
  const verify = page.getByRole('button',{name:'Verify',exact:true})
  await expect(verify).toBeVisible()
  unavailable = false
  await verify.click()
  await expect(page.locator('tbody')).toContainText('Confirmed before refresh')
  await expect(verify).toHaveCount(0)
  expect(writes).toBe(1)
})

test('another account never sees a delayed confirmation from the old session', async ({page, context}) => {
  await account(context)
  await page.goto('/finance/categories')
  await expect(page.getByText('No categories yet.')).toBeVisible()
  const release = Promise.withResolvers<void>()
  const saved = Promise.withResolvers<void>()
  await page.route('**/api/finance/categories', async route => {
    if (route.request().method() !== 'POST') return route.continue()
    const response = await route.fetch()
    expect(response.status()).toBe(201)
    saved.resolve()
    await release.promise
    await route.fulfill({response}).catch(() => {})
  })
  await page.getByRole('button',{name:'+ Add category',exact:true}).click()
  await page.getByRole('dialog').getByLabel('Name',{exact:true}).fill('Private previous draft')
  await page.getByRole('dialog').getByRole('button',{name:'Save',exact:true}).click()
  try {
    await saved.promise
    await expect(page.getByRole('row').filter({hasText:'Private previous draft'})).toBeVisible()
    await account(context)
    await page.evaluate(() => {
      const channel = new BroadcastChannel('finance-session')
      channel.postMessage('changed')
      channel.close()
    })
    await expect(page.getByText('No categories yet.')).toBeVisible()
    await expect(page.getByText(/Private previous draft/)).toHaveCount(0)
  } finally { release.resolve() }
  await expect(page.locator('.Toastify__toast').filter({hasText:'Saved.'})).toHaveCount(0)
  expect((await (await context.request.get(origin + '/api/finance/categories')).json()).items).toHaveLength(0)
})

test('budget forms offer only unused categories and keep the category being edited', async ({page, context}) => {
  await account(context)
  for (const name of ['Travel', 'Groceries']) {
    const category = await (await write(context, 'categories', 'POST', JSON.stringify({ name }))).json()
    expect((await write(context, 'budgets', 'POST', JSON.stringify({
      categoryId: category.id, spendingLimit: 100, color: '#277C78',
    }))).status()).toBe(201)
  }
  await write(context, 'categories', 'POST', '{"name":"Dining"}')

  await page.route(/\/api\/finance\/budgets\?month=2027-02$/, route => route.fulfill({json: {items: []}}))
  await page.goto('/finance/budgets')
  await expect(page.getByRole('heading', {name: 'Travel', exact: true, level: 2})).toBeVisible()
  await page.getByRole('button', {name: 'Open calendar · Month'}).click()
  const calendar = page.getByRole('dialog', {name: 'Month', exact: true})
  await calendar.getByRole('combobox', {name: 'Choose the Month'}).selectOption('1')
  await calendar.getByRole('button', {name: 'Select month'}).click()
  await expect(page.getByText('No budgets yet.', {exact: true})).toBeVisible()
  await page.getByRole('button', {name: '+ Add New Budget'}).click()
  await page.getByRole('dialog').getByRole('button', {name: 'Category', exact: true}).click()
  await expect(page.getByRole('menu').locator('[role="menuitemradio"], [role="menuitem"]')).toHaveText(['Dining', 'Add a category'])
  const select = page.getByRole('dialog').getByRole('combobox', {name: 'Category', exact: true})

  await page.goto('/finance/budgets')
  const card = page.locator('article').filter({has: page.getByRole('button', {name: /^Actions: Travel \(/})})
  await menu(page, card, 'Edit')
  await expect(select).toHaveText('Travel')
  await select.click()
  await expect(page.getByRole('option')).toHaveText(['Travel', 'Dining'])
})

test('select arrows indicate available scroll without receiving pointer events', async ({page, context}) => {
  await account(context)
  await page.setViewportSize({width: 1000, height: 500})
  await page.goto('/finance/budgets')
  await page.getByRole('button', {name: '+ Add New Budget', exact: true}).click()
  await page.getByRole('dialog').getByRole('combobox', {name: 'Color Tag', exact: true}).click()

  const list = page.getByRole('listbox')
  const down = list.locator('div[aria-hidden="true"]').filter({has: page.locator('svg.lucide-chevron-down')})
  const up = list.locator('div[aria-hidden="true"]').filter({has: page.locator('svg.lucide-chevron-up')})
  await expect(down).toBeVisible()
  await expect(down).toHaveCSS('pointer-events', 'none')

  const viewport = list.locator('[data-radix-select-viewport]')
  await viewport.hover()
  await page.mouse.wheel(0, 80)
  await expect(up).toBeVisible()
  await expect(up).toHaveCSS('pointer-events', 'none')
})

test('a budget shows its edited color and amount before confirmation', async ({page, context}) => {
  await account(context)
  const category = await (await write(context,'categories','POST','{"name":"Travel budget"}')).json()
  const budget = await (await write(context,'budgets','POST',
    `{"categoryId":${category.id},"spendingLimit":30,"color":"#277C78"}`)).json()
  await page.goto('/finance/budgets')
  const card = page.locator('article').filter({has:page.getByRole('button',{name:/^Actions: Travel budget/})})
  const color = card.locator('header span').first()
  const dialog = page.getByRole('dialog')
  const hold = Promise.withResolvers<void>()
  await page.route('**/api/finance/budgets/' + budget.id, async route => {
    if (route.request().method() !== 'PUT') return route.continue()
    await hold.promise
    await route.continue()
  })
  await menu(page,card,'Edit')
  await choose(page,'Color Tag','Cyan')
  await dialog.getByLabel('Maximum Spending',{exact:true}).fill('75')
  await dialog.getByRole('button',{name:'Save Changes',exact:true}).click()
  try {
    await expect(dialog).toHaveCount(0)
    await expect(color).toHaveCSS('background-color','rgb(130, 201, 215)')
    await expect(card).toContainText('$75.00')
  } finally { hold.resolve() }
  await expect(color).toHaveCSS('background-color','rgb(130, 201, 215)')
  await expect(card).toContainText('$75.00')
})

test('financial pagination shows numbered links on desktop and an indicator on tablet and mobile', async ({page, context}) => {
  await account(context)
  await page.goto('/finance/pots')
  await expect(page.getByText('No pots yet.')).toBeVisible()
  const pagination = page.getByRole('navigation', {name: 'pagination'})
  const numbered = pagination.getByRole('link', {name: /^\d+$/})
  const indicator = pagination.getByRole('status')
  const next = pagination.getByRole('link', {name: 'Go to next page'})
  const previous = pagination.getByRole('link', {name: 'Go to previous page'})
  const first = pagination.getByRole('link', {name: 'Go to first page'})
  const last = pagination.getByRole('link', {name: 'Go to last page'})
  const gaps = pagination.getByText('…', {exact: true}).filter({visible: true})

  for (const [section, resource] of [['Transactions', 'transactions'], ['Recurring bills', 'recurring-payments']] as const) {
    await page.route('**/api/finance/' + resource + '*', route => {
      const query = new URL(route.request().url()).searchParams
      return route.fulfill({json: {items: [], totalPages: 120, totalElements: 480, size: 4, page: Number(query.get('page') ?? 0)}})
    })
    await page.setViewportSize({width: 1280, height: 900})
    await page.getByRole('link', {name: section, exact: true}).click()
    await expect(numbered).toHaveText(['1','2','3','4','120'])
    await page.evaluate(() => history.pushState(null, '', '?page=100'))
    await expect(numbered).toHaveText(['1','99','100','101','120'])
    await expect(numbered.filter({hasText: /^100$/})).toHaveAttribute('aria-current','page')
    await expect(gaps).toHaveCount(2)
    for (const width of [768, 390]) {
      await page.setViewportSize({width, height: 900})
      await expect(numbered).toHaveCount(0)
      await expect(pagination.getByRole('link')).toHaveCount(4)
      await expect(gaps).toHaveCount(0)
      await expect(indicator).toHaveText('100 of 120')
    }
    await next.click()
    await expect(indicator).toHaveText('101 of 120')
    await previous.click()
    await expect(indicator).toHaveText('100 of 120')
    await last.click()
    await expect(indicator).toHaveText('120 of 120')
    await expect(next).toHaveAttribute('aria-disabled','true')
    await expect(last).toHaveAttribute('aria-disabled','true')
    await first.click()
    await expect(indicator).toHaveText('1 of 120')
    await expect(previous).toHaveAttribute('aria-disabled','true')
    await expect(first).toHaveAttribute('aria-disabled','true')
  }
})

test('Overview lists four budget categories and keeps the chart total', async ({page, context}) => {
  await account(context)
  for (const name of ['Food', 'Home', 'Transport', 'Health', 'Leisure']) {
    const category = await (await write(context,'categories','POST',JSON.stringify({name}))).json()
    expect((await write(context,'budgets','POST',JSON.stringify({
      categoryId: category.id, spendingLimit: 10, color: '#277C78',
    }))).status()).toBe(201)
  }

  await page.goto('/finance')
  const card = page.locator('article').filter({
    has: page.getByRole('heading', { name: 'Budgets', level: 2, exact: true }),
  })
  await expect(card.getByRole('heading', { level: 3 })).toHaveCount(4)
  await expect(card).toContainText('of $50.00 limit')
  await card.getByRole('link', { name: 'See Details' }).click()
  for (const name of ['Food', 'Home', 'Transport', 'Health', 'Leisure']) {
    await expect(page.getByRole('heading', { name, level: 2, exact: true })).toBeVisible()
  }
})

for (const language of ['en', 'es']) test(`a new budget appears once while the write is held in ${language}`, async ({page, context}) => {
  await account(context, language)
  const spanish = language === 'es'
  if (spanish) {
    await page.setViewportSize({width: 390, height: 844})
    await page.emulateMedia({reducedMotion:'reduce'})
  }
  await write(context, 'categories', 'POST', '{"name":"Food budget"}')
  await page.goto('/finance/budgets')
  await expect(page.getByText(spanish ? 'Aún no hay presupuestos.' : 'No budgets yet.')).toBeVisible()
  const hold = Promise.withResolvers<void>()
  let writes = 0
  await page.route('**/api/finance/budgets', async route => {
    if (route.request().method() !== 'POST') return route.continue()
    writes++
    await hold.promise
    await route.continue()
  })
  const add = page.getByRole('button', {name:spanish ? '+ Agregar presupuesto' : '+ Add New Budget', exact:true})
  const dialog = page.getByRole('dialog')
  await add.click()
  await choose(page, spanish ? 'Categoría' : 'Category', 'Food budget')
  await dialog.getByLabel(spanish ? 'Gasto máximo' : 'Maximum Spending').fill('500')
  await dialog.getByRole('button', {name:spanish ? 'Agregar presupuesto' : 'Add Budget', exact:true}).click()
  const card = page.getByRole('heading', {name:'Food budget', level:2})
  try {
    await expect(dialog).toHaveCount(0)
    await expect(card).toBeVisible()
    const budgetCard = page.locator('article').filter({has: card})
    await expect(budgetCard).toContainText('$500.00')
    await expect(budgetCard.locator('header span').first()).toHaveCSS('background-color', 'rgb(39, 124, 120)')
    await expect(page.getByText(spanish ? 'de $500.00 de límite' : 'of $500.00 limit', {exact:true})).toBeVisible()
    await expect(page.getByText(spanish ? 'Aún no hay presupuestos.' : 'No budgets yet.')).toHaveCount(0)
    await add.click()
    await dialog.getByRole('button', {name:spanish ? 'Categoría' : 'Category', exact:true}).click()
    await expect(page.getByRole('menuitemradio')).toHaveCount(0)
    await expect(page.getByRole('menuitem')).toHaveText(spanish ? 'Añadir categoría' : 'Add a category')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toHaveCount(0)
    await dialog.getByRole('button', {name:spanish ? 'Cerrar' : 'Close', exact:true}).click()
    await page.getByRole('link', {name:spanish ? 'Resumen' : 'Overview', exact:true}).press('Enter')
    await expect(page.getByRole('heading', {name:spanish ? 'Resumen' : 'Overview', exact:true})).toBeVisible()
    await expect(page.getByRole('heading', {name:'Food budget', level:3})).toBeVisible()
    await page.getByRole('link', {name:spanish ? 'Presupuestos' : 'Budgets', exact:true}).press('Enter')
    await expect(card).toHaveCount(1)
  } finally { hold.resolve() }
  await expect(page.getByRole('button', {name:spanish ? /^Acciones: Food budget/ : /^Actions: Food budget/})).toBeVisible()
  await expect(card).toHaveCount(1)
  expect(writes).toBe(1)
})

test('an uncached finance region uses a skeleton and preserves navigation', async ({page, context}) => {
  await account(context, 'es')
  await page.setViewportSize({width: 320, height: 750})
  await page.emulateMedia({reducedMotion: 'reduce'})
  await page.goto('/finance/pots')
  await expect(page.getByText('Aún no hay apartados.')).toBeVisible()
  const hold = Promise.withResolvers<void>()
  await page.route('**/api/finance/budgets', async route => {
    await hold.promise
    await route.continue()
  })
  try {
    await page.locator('a[href="/finance/budgets"]').first().click()
    await expect(page.getByRole('heading', {name:'Presupuestos', exact:true})).toBeVisible()
    const busy = page.locator('main [aria-busy="true"]')
    await expect(busy.locator('[data-slot="skeleton"]').first()).toBeVisible()
    await expect(busy.locator('[data-slot="skeleton"]').first()).toHaveCSS('animation-name', 'none')
    await expect(page.getByRole('status').filter({hasText:'Cargando…'})).toHaveCount(1)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  } finally { hold.resolve() }
  await expect(page.getByText('Aún no hay presupuestos.')).toBeVisible()
  await expect(page.locator('main [aria-busy="true"]')).toHaveCount(0)
})

test('a sensitive identity check replaces private data with a neutral skeleton', async ({page, context}) => {
  await account(context)
  await write(context, 'categories', 'POST', '{"name":"Private travel category"}')
  await page.goto('/finance/categories')
  const privateRow = page.getByRole('row').filter({hasText:'Private travel category'})
  await expect(privateRow).toBeVisible()
  const hold = Promise.withResolvers<void>()
  await page.route('**/api/auth/me', async route => {
    await hold.promise
    await route.continue()
  })
  try {
    await page.evaluate(() => window.dispatchEvent(new Event('finance-session-expired')))
    await expect(privateRow).toHaveCount(0)
    await expect(page.locator('main [data-slot="skeleton"]').first()).toBeVisible()
  } finally { hold.resolve() }
  await expect(privateRow).toBeVisible()
  await expect(page.locator('main [data-slot="skeleton"]')).toHaveCount(0)
})

test('a budget adopts the canonical result across a racing period read and a failed refresh', async ({page, context}) => {
  await account(context)
  await write(context, 'categories', 'POST', '{"name":"Racing budget"}')
  await page.goto('/finance/budgets')
  await expect(page.getByText('No budgets yet.')).toBeVisible()
  const release = Promise.withResolvers<void>()
  const persisted = Promise.withResolvers<void>()
  let writes = 0
  let refreshFails = false
  await page.route(/\/api\/finance\/budgets(?:\?.*)?$/, async route => {
    const request = route.request()
    if (request.method() === 'GET') return refreshFails ? route.fulfill({status:503}) : route.continue()
    writes++
    const response = await route.fetch({postData: {...request.postDataJSON(), spendingLimit: 600}})
    expect(response.status()).toBe(201)
    persisted.resolve()
    await release.promise
    await route.fulfill({response})
  })
  await page.getByRole('button', {name:'+ Add New Budget', exact:true}).click()
  await choose(page, 'Category', 'Racing budget')
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Maximum Spending').fill('500')
  await dialog.getByRole('button', {name:'Add Budget', exact:true}).click()
  const heading = page.getByRole('heading', {name:'Racing budget', level:2})
  const card = page.locator('article').filter({has:heading})
  try {
    await expect(card).toContainText('$500.00')
    await persisted.promise
    await page.getByLabel('Month', {exact:true}).fill('2027-02')
    await expect(page).toHaveURL(/month=2027-02/)
    await expect(card).toContainText('$500.00')
    await expect(heading).toHaveCount(1)
    refreshFails = true
  } finally { release.resolve() }
  await expect(card).toContainText('$600.00')
  await expect(heading).toHaveCount(1)
  const verify = page.getByRole('button', {name:'Verify', exact:true})
  await expect(verify).toBeVisible()
  refreshFails = false
  await verify.click()
  await expect(verify).toHaveCount(0)
  await expect(card).toContainText('$600.00')
  expect(writes).toBe(1)
})

for (const language of ['en', 'es']) test(`each finance destination exposes its loading structure in ${language}`, async ({page, context}) => {
  await account(context, language)
  const spanish = language === 'es'
  if (spanish) {
    await page.setViewportSize({width: 390, height: 844})
    await page.emulateMedia({reducedMotion:'reduce'})
  }
  await page.goto('/finance/categories')
  await expect(page.getByText(spanish ? 'Aún no hay categorías.' : 'No categories yet.')).toBeVisible()
  const hold = Promise.withResolvers<void>()
  await page.route('**/api/finance/**', async route => {
    await hold.promise
    await route.continue().catch(() => {})
  })
  const destinations = [
    [spanish ? 'Transacciones' : 'Transactions', '/finance/transactions'],
    [spanish ? 'Presupuestos' : 'Budgets', '/finance/budgets'],
    [spanish ? 'Apartados' : 'Pots', '/finance/pots'],
    [spanish ? 'Pagos recurrentes' : 'Recurring Bills', '/finance/recurring-bills'],
    [spanish ? 'Resumen' : 'Overview', '/finance'],
  ] as const
  try {
    for (const [title, href] of destinations) {
      await page.locator(`nav a[href="${href}"]`).first().press('Enter')
      await expect(page).toHaveURL(href)
      await expect(page.getByRole('heading', {name:title, exact:true, level:1})).toBeVisible()
      const loading = page.locator('main [aria-busy="true"]')
      await expect(loading.locator('[data-slot="skeleton"]').first()).toBeVisible()
      if (href === '/finance/pots') {
        const actions = loading.locator('.rounded-xl').first().locator(':scope > :last-child > [data-slot="skeleton"]')
        await expect(actions).toHaveCount(2)
        await expect(actions.first()).toHaveCSS('height', '53px')
        await expect(actions.last()).toHaveCSS('height', '53px')
      }
    }
  } finally { hold.resolve() }
  await expect(page.getByRole('heading', {name:spanish ? 'Saldo actual' : 'Current Balance'})).toBeVisible()
  await expect(page.locator('main [aria-busy="true"]')).toHaveCount(0)

  await page.goto('/finance/pots')
  await expect(page.getByText(spanish ? 'Aún no hay apartados.' : 'No pots yet.')).toBeVisible()
  const categoryHold = Promise.withResolvers<void>()
  let fail = true
  await page.route('**/api/finance/categories', async route => {
    await categoryHold.promise
    if (fail) await route.fulfill({status:503})
    else await route.continue()
  })
  try {
    await page.locator('nav a[href="/finance/categories"]').first().press('Enter')
    await expect(page.locator('main [aria-busy="true"] [data-slot="skeleton"]').first()).toBeVisible()
  } finally { categoryHold.resolve() }
  const reload = page.getByRole('button', {name: spanish ? 'Recargar datos' : 'Reload data', exact:true})
  await expect(reload).toBeVisible()
  fail = false
  await reload.click()
  await expect(page.getByText(spanish ? 'Aún no hay categorías.' : 'No categories yet.')).toBeVisible()
})

test('an expense appears in its list and calculable totals before confirmation', async ({page, context}) => {
  await account(context)
  const { id } = await (await write(context, 'categories', 'POST', '{"name":"Lunch category"}')).json()
  await write(context, 'budgets', 'POST', JSON.stringify({categoryId:id, spendingLimit:100, color:'#277C78'}))
  await page.goto('/finance')
  await expect(page.getByRole('heading', {name:'Expenses', exact:true})).toBeVisible()
  const hold = Promise.withResolvers<void>()
  await page.route('**/api/finance/transactions', async route => {
    if (route.request().method() === 'POST') await hold.promise
    await route.continue()
  })
  await page.getByRole('link', {name:'Transactions', exact:true}).click()
  await page.getByRole('button', {name:'+ Add transaction', exact:true}).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Name', {exact:true}).fill('Optimistic lunch')
  await choose(page, 'Category', 'Lunch category')
  await dialog.getByLabel('Transaction Date', {exact:true}).fill('2027-03-15')
  await dialog.getByLabel('Amount', {exact:true}).fill('25')
  await dialog.getByRole('button', {name:'Save', exact:true}).click()
  try {
    await expect(page.getByRole('row').filter({hasText:'Optimistic lunch'})).toContainText('-$25.00')
    await page.getByRole('link', {name:'Overview', exact:true}).click()
    const expenses = page.locator('article').filter({has:page.getByRole('heading', {name:'Expenses', exact:true})})
    await expect(expenses).toContainText('$25.00')
    await expect(page.locator('[data-chart]')).toContainText('$25.00')
    await expect(page.getByText('Optimistic lunch', {exact:true})).toBeVisible()
  } finally { hold.resolve() }
  await expect(page.locator('.Toastify__toast').filter({hasText:'Saved.'})).toBeVisible()
})

test('a saved cut stays editable while its new summary waits for Spring', async ({page, context}) => {
  await account(context)
  await page.goto('/finance')
  await expect(page.getByText(/Reporting period/)).toBeVisible()
  const configure = page.getByRole('button', {name:'Configure period', exact:true})
  const panel = page.getByRole('heading', {name:'Transactions', exact:true, level:2})
  const hold = Promise.withResolvers<void>()
  await page.route('**/api/finance/financial-summary/settings', async route => {
    if (route.request().method() !== 'PUT') return route.continue()
    await hold.promise
    await route.fulfill({status:409})
  })
  const dialog = page.getByRole('dialog')
  await configure.click()
  await dialog.getByLabel('Start day').fill('10')
  await dialog.getByRole('button', {name:'Save', exact:true}).click()
  try {
    await expect(dialog).toBeHidden()
    await expect(panel).toBeVisible()
    await expect(page.getByText(/Reporting period/)).toHaveCount(0)
    await expect(page.locator('main [aria-busy="true"] [data-slot="skeleton"]').first()).toBeVisible()
    await configure.click()
    await expect(dialog.getByLabel('Start day')).toHaveValue('10')
    await page.keyboard.press('Escape')
  } finally { hold.resolve() }
  await expect(page.getByText(/Reporting period/)).toBeVisible()
  await page.getByRole('button', {name:'Review draft', exact:true}).click()
  await expect(dialog.getByLabel('Start day')).toHaveValue('10')
})

test('recurring bills reserve the summary and list positions until each response arrives', async ({page, context}) => {
  await account(context)
  const {id} = await (await write(context, 'categories', 'POST', '{"name":"Office"}')).json()
  await write(context, 'recurring-payments', 'POST', JSON.stringify({
    name: 'Internet', categoryId: id, amount: 20, type: 'SUBSCRIPTION', firstDueDate: '2027-03-01',
  }))
  await page.goto('/finance/categories')
  await expect(page.getByRole('row').filter({hasText:'Office'})).toBeVisible()

  const summary = Promise.withResolvers<void>()
  const rows = Promise.withResolvers<void>()
  await page.route(/\/api\/finance\/recurring-payments(?:\/summary)?(?:\?.*)?$/, async route => {
    const isSummary = new URL(route.request().url()).pathname.endsWith('/summary')
    await (isSummary ? summary.promise : rows.promise)
    await route.continue()
  })
  try {
    await page.setViewportSize({width: 1280, height: 900})
    await page.locator('nav a[href="/finance/recurring-bills"]').press('Enter')
    const loading = page.locator('main [aria-busy="true"]')
    const search = page.getByRole('textbox', {name:'Search bills'})
    await expect(search).toBeVisible()
    await expect(loading).toHaveCount(2)
    await expect(loading.first().locator('.bg-grey-900')).toBeVisible()
    await expect(loading.last().locator('[data-slot="skeleton"]').first()).toBeVisible()
    const summaryBox = (await loading.first().boundingBox())!
    const searchBox = (await search.boundingBox())!
    expect(summaryBox.width).toBe(337)
    expect(summaryBox.x + summaryBox.width).toBeLessThan(searchBox.x)

    await page.setViewportSize({width: 390, height: 844})
    const mobileSummary = (await loading.first().boundingBox())!
    const mobileSearch = (await search.boundingBox())!
    expect(mobileSummary.y + mobileSummary.height).toBeLessThan(mobileSearch.y)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)

    summary.resolve()
    await expect(page.getByText('Total Bills', {exact:true})).toBeVisible()
    await expect(loading).toHaveCount(1)
  } finally {
    summary.resolve()
    rows.resolve()
  }
  await expect(page.getByRole('row').filter({hasText:'Internet'})).toBeVisible()
  await expect(page.locator('main [aria-busy="true"]')).toHaveCount(0)
})

test('a budget can create its first category without losing its draft', async ({page, context}) => {
  await account(context)
  await page.goto('/finance/budgets')
  await page.getByRole('button', {name:'+ Add New Budget', exact:true}).click()
  const budget = page.getByRole('dialog', {name:'Add New Budget', exact:true})
  const categoryPicker = budget.getByRole('button', {name:'Category', exact:true})
  await expect(categoryPicker).toHaveText('Category')
  await budget.getByLabel('Maximum Spending').fill('250')
  const writes: string[] = []
  page.on('request', request => {
    if (request.method() === 'POST' && request.url().includes('/api/finance/')) writes.push(new URL(request.url()).pathname)
  })
  await budget.getByRole('button', {name:'Add Budget', exact:true}).click()
  await expect(categoryPicker).toHaveAttribute('aria-invalid', 'true')
  expect(writes).toEqual([])

  await categoryPicker.press('Enter')
  const action = page.getByRole('menuitem', {name:'Add a category', exact:true})
  await expect(action).toBeFocused()
  await expect(page.getByRole('menuitemradio')).toHaveCount(0)
  await action.press('Enter')
  const category = page.getByRole('dialog', {name:'Add category', exact:true})
  const name = category.getByLabel('Name', {exact:true})
  await expect(name).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(category).toHaveCount(0)
  await expect(categoryPicker).toBeFocused()

  await categoryPicker.click()
  await action.click()
  await name.fill('New travel category')
  await category.getByRole('button', {name:'Save', exact:true}).click()
  await expect(category).toHaveCount(0)
  await expect(budget.getByLabel('Maximum Spending')).toHaveValue('250')
  await categoryPicker.click()
  await expect(page.getByRole('menu').locator('[role="menuitemradio"], [role="menuitem"]'))
    .toHaveText(['New travel category', 'Add a category'])
  await page.getByRole('menuitemradio', {name:'New travel category', exact:true}).click()
  await save(page)
  await expect(page.getByRole('heading', {name:'New travel category', level:2})).toBeVisible()
  expect(writes).toEqual(['/api/finance/categories', '/api/finance/budgets'])
})
