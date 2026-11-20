import { expect, test, type BrowserContext, type Locator, type Page } from '@playwright/test'
const origin='http://localhost:3100',upstream='http://127.0.0.1:3101'
async function account(context:BrowserContext,language='en') {
  const email=`finance-${Date.now()}-${Math.random()}@example.test`,password='test-password-123'
  const token=await (await context.request.get(origin+'/api/auth/csrf')).json()
  const headers={Origin:origin,[token.headerName]:token.token}
  expect((await context.request.post(origin+'/api/auth/register',{headers,data:{name:'Finance test',email,password}})).status()).toBe(201)
  expect((await context.request.post(origin+'/api/auth/login',{headers,form:{email,password}})).status()).toBe(204)
  await context.addCookies([{name:'finance-language',value:language,url:origin}])
  return email
}
async function write(context:BrowserContext,path:string,method='POST',body?:string) {
  const token=await (await context.request.get(origin+'/api/auth/csrf')).json()
  return context.request.fetch(origin+'/api/finance/'+path,{method,headers:{Origin:origin,[token.headerName]:token.token,'Content-Type':'application/json'},data:body})
}
async function control(context:BrowserContext,path:string,data?:unknown) {
  const cookie=(await context.cookies()).find(item=>item.name === 'JSESSIONID')!
  return context.request.post(upstream+'/__finance/'+path,{headers:{Cookie:`JSESSIONID=${cookie.value}`},data})
}
async function choose(page:Page,label:string,text:string) {await page.getByRole('dialog').getByRole('combobox',{name:label,exact:true}).click();await page.getByRole('option',{name:text,exact:true}).click()}
async function save(page:Page) {const dialog=page.getByRole('dialog');await dialog.locator('button[type="submit"]').click();await expect(dialog).toBeHidden()}
async function category(page:Page,name:string) {await page.getByRole('button',{name:'+ Add category',exact:true}).click();await page.getByRole('dialog').getByLabel('Name',{exact:true}).fill(name);await save(page)}
async function menu(page:Page,row:Locator,action:string) {await row.getByRole('button',{name:/^Actions:/}).click();await page.getByRole('menuitem',{name:action,exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible()}

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
  expect(histories).toBe(0)
  const expense = await (await write(context,'transactions','POST',`{"name":"Late preview","categoryId":${categoryIds[0]},"transactionDate":"2027-03-20","amount":-10}`)).json()
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  try {
    await started.promise
    expect(histories).toBe(1)
    await write(context,`transactions/${expense.id}`,'DELETE')
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
    await expect(page.getByText('No recent expenses.',{exact:true})).toHaveCount(3)
  } finally { release.resolve() }
  await expect(page.getByText('Late preview',{exact:true})).toHaveCount(0)
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
    const heading=page.getByRole('heading',{level:1}),before=(await heading.boundingBox())!
    await page.getByRole('button',{name:add,exact:true}).click()
    await page.getByRole('dialog').getByLabel(name,{exact:true}).fill('Toast '+language)
    await save(page)
    const notice=page.locator('.Toastify__toast').filter({hasText:saved})
    await expect(notice).toBeVisible()
    await expect(page.locator('.Toastify__toast-container')).toHaveCSS('position','fixed')
    expect((await heading.boundingBox())!.y).toBe(before.y)
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true)
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
    await calendar.fill('2027-02')
    await expect(page).toHaveURL(/month=2027-02/)
    await page.reload()
    await expect(page.getByRole('button',{name:'Logout',exact:true})).toBeEnabled()
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
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('used by a budget')
  await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape')
  await expect(rows.nth(0).getByRole('button',{name:/^Actions:/})).toBeFocused()
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
  await dialog.getByLabel('First due date',{exact:true}).fill('2027-01-31')
  const created=page.waitForRequest(request=>request.url() === origin+'/api/finance/recurring-payments' && request.method() === 'POST')
  await save(page)
  expect((await created).postDataJSON()).toMatchObject({categoryId:cat.id,intervalMonths:3,amount:30,type:'SUBSCRIPTION'})
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
  await choose(page,'Tipo de pago','Compra a plazos')
  await expect(dialog.getByRole('combobox',{name:'Frecuencia',exact:true})).toHaveCount(0)
  await dialog.getByLabel('Número de cuotas',{exact:true}).fill('2')
  const converted=page.waitForRequest(request=>request.url().startsWith(origin+'/api/finance/recurring-payments/') && request.method() === 'PUT')
  await save(page)
  expect((await converted).postDataJSON()).toMatchObject({intervalMonths:1,totalInstallments:2,type:'INSTALLMENT',amount:30})
})

test('complete financial flow refreshes sections and overview with server data',async({page,context})=>{
  test.setTimeout(120_000)
  await account(context);await page.goto('/finance/categories');await category(page,'Personal')
  await page.goto('/finance/budgets');await page.getByRole('button',{name:'+ Add New Budget',exact:true}).click()
  await choose(page,'Category','Personal');await page.getByRole('dialog').getByLabel('Maximum Spending',{exact:true}).fill('40');await save(page)
  await page.goto('/finance/transactions');await page.getByRole('button',{name:'+ Add transaction',exact:true}).click()
  await page.getByRole('dialog').getByLabel('Name',{exact:true}).fill('Groceries recorded')
  await choose(page,'Category','Personal');await page.getByRole('dialog').getByLabel('Transaction Date',{exact:true}).fill('2027-03-20');await page.getByRole('dialog').getByLabel('Amount',{exact:true}).fill('50.25');await save(page)
  await expect(page.getByRole('status')).toContainText('Budget limit reached.')
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
  await menu(page,edited,'Edit');await page.getByRole('dialog').getByLabel('Amount',{exact:true}).fill('2');await save(page)
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
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('result is uncertain')
  await page.getByRole('dialog').getByRole('button',{name:'Reload data',exact:true}).click();await page.keyboard.press('Escape')
  await expect(page.locator('tbody tr')).toHaveCount(1);expect(submissions).toBe(1)
  await page.getByRole('button',{name:'Logout',exact:true}).click();await expect(page).toHaveURL('/login')
  await page.getByRole('button',{name:'Continue as guest',exact:true}).click()
  await expect(page).toHaveURL('/finance')
  await expect(page.getByRole('button',{name:'Logout',exact:true})).toBeVisible()
  let requests=0;page.on('request',request=>{if(request.url().includes('/api/finance/'))requests++})
  for(const route of ['','/categories','/transactions','/budgets','/pots','/recurring-bills'])await page.goto('/finance'+route)
  expect(requests).toBe(0)
})

test('visible overview observes an automatic payment without sending a financial mutation',async({page,context})=>{
  await account(context)
  const cat=await(await write(context,'categories','POST','{"name":"Automatic"}')).json()
  await write(context,'recurring-payments','POST',`{"name":"Server payment","categoryId":${cat.id},"type":"SUBSCRIPTION","amount":10,"firstDueDate":"2027-03-20"}`)
  await page.clock.install();await page.goto('/finance');await expect(page.locator('main')).not.toContainText('Server payment')
  await expect(page.locator('main [inert]')).toHaveCount(0)
  let writes=0;page.on('request',request=>{if(request.url().includes('/api/finance/') && request.method() !== 'GET')writes++})
  expect((await control(context,'job')).status()).toBe(204)
  await page.clock.runFor(60_100);await expect(page.locator('main')).toContainText('Server payment');expect(writes).toBe(0)
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
  await page.getByRole('dialog').getByLabel('Amount',{exact:true}).fill('25');await save(page)
  await page.goto('/finance/pots');await expect(page.locator('main')).toContainText('$75.00')
  await page.goto('/finance/transactions');row=page.locator('article').filter({hasText:'Linked pot'}).filter({hasText:'+$100.00'})
  await menu(page,row,'Edit');await page.getByRole('dialog').getByLabel('Amount',{exact:true}).fill('10')
  await page.getByRole('dialog').getByRole('button',{name:'Save',exact:true}).click()
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('conflicts');await expect(page.getByRole('dialog').getByLabel('Amount',{exact:true})).toHaveValue('10');await page.keyboard.press('Escape')
  const recurring=await(await write(context,'recurring-payments','POST',`{"name":"Linked recurring","categoryId":${cat.id},"type":"INSTALLMENT","amount":10,"firstDueDate":"2027-01-31","totalInstallments":12}`)).json()
  await write(context,`recurring-payments/${recurring.id}/payments/2027-03`,'PUT')
  await page.goto('/finance/transactions?query=Linked+recurring');row=page.locator('article').filter({has:page.getByText('Linked recurring',{exact:true})})
  await menu(page,row,'Edit');await page.getByRole('dialog').getByLabel('Name',{exact:true}).fill('Corrected refund');await choose(page,'Transaction type','Income');await save(page)
  await page.goto('/finance/recurring-bills');const bill=page.locator('article').filter({has:page.getByText('Linked recurring',{exact:true})}).last()
  await expect(bill).toContainText('Void');await expect(bill).toContainText('Installment 3/12');await expect(bill).toContainText('Paid installments: 0')
  await expect(bill.getByText('Installment 3/12 · Paid: $0.00 of $120.00')).toBeVisible()
  await menu(page,bill,'Mark paid');await save(page);await expect(bill).toContainText('Paid installments: 1')
  await expect(bill.getByText('Installment 3/12 · Paid: $10.00 of $120.00')).toBeVisible()
  await page.goto('/finance/transactions?query=Corrected+refund');row=page.locator('article').filter({has:page.getByText('Corrected refund',{exact:true})})
  await menu(page,row,'Edit');await choose(page,'Transaction type','Expense');await page.getByRole('dialog').getByRole('button',{name:'Save',exact:true}).click()
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('conflicts');await page.keyboard.press('Escape')
  await page.goto('/finance/recurring-bills');await menu(page,bill,'Edit');await page.getByRole('dialog').getByLabel('First due date',{exact:true}).fill('2027-02-28');await page.getByRole('dialog').getByRole('button',{name:'Save',exact:true}).click()
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
