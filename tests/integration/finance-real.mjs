import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { chromium, expect } from '@playwright/test'
import { isLosslessNumber, parse, stringify, LosslessNumber } from 'lossless-json'

const origin=process.env.FINANCE_SMOKE_ORIGIN ?? 'http://localhost:3220'
const numeric=new Set(['categoryId','amount','targetAmount','spendingLimit','startDay','totalInstallments'])
const decode=text=>parse(text,(key,value)=>isLosslessNumber(value)?value.value:value)
const encode=value=>stringify(value,(key,item)=>item !== null && numeric.has(key)?new LosslessNumber(String(item)):item)
const browser=await chromium.launch({headless:true})
const context=await browser.newContext({baseURL:origin})
const today=new Date().toISOString().slice(0,10),month=today.slice(0,7)
const ids={categories:[],budgets:[],pots:[],recurring:[]}
let authenticated=false,primaryError
async function authenticate(target) {
  const email='finance-smoke-'+randomUUID()+'@example.test',password=randomUUID()
  const token=await(await target.request.get(origin+'/api/auth/csrf')).json()
  const headers={Origin:origin,[token.headerName]:token.token}
  assert.equal((await target.request.post(origin+'/api/auth/register',{headers,data:{name:'Financial smoke',email,password}})).status(),201)
  assert.equal((await target.request.post(origin+'/api/auth/login',{headers,form:{email,password}})).status(),204)
}
async function request(method,path,data,expected=200,target=context) {
  const headers={Origin:origin,'Content-Type':'application/json'}
  if(method !== 'GET') {const token=await(await target.request.get(origin+'/api/auth/csrf')).json();headers[token.headerName]=token.token}
  const response=await target.request.fetch(origin+'/api/finance/'+path,{method,headers,...(data === undefined?{}:{data:encode(data)})})
  assert.equal(response.status(),expected,`${method} ${path}: expected ${expected}, received ${response.status()}`)
  const text=await response.text()
  return text?decode(text):undefined
}
async function create(resource,data) {
  const row=await request('POST',resource,data,201)
  ids[resource === 'savings-pots'?'pots':resource === 'recurring-payments'?'recurring':resource].push(row.id)
  return row
}
try {
  await authenticate(context)
  authenticated=true
  const page=await context.newPage()
  await page.goto(origin+'/finance/categories')
  await expect(page.getByText('No categories yet.',{exact:true})).toBeVisible()
  const category=await create('categories',{name:'Smoke category'})
  const budget=await create('budgets',{categoryId:category.id,spendingLimit:'10.00',color:'#ABCDEF'})
  const income=await request('POST','transactions',{name:'Income',categoryId:category.id,transactionDate:today,amount:'100.00'},201)
  const expense=await request('POST','transactions',{name:'Expense',categoryId:category.id,transactionDate:today,amount:'-12.34'},201)
  assert.equal(expense.budgetWarnings[0].limitReached,true)
  assert.equal(expense.budgetWarnings[0].exceededAmount,'2.34')
  const filtered=await request('GET',`transactions?categoryId=${category.id}&page=1&size=1&sort=newest`)
  assert.equal(filtered.items.length,1);assert.equal(filtered.totalElements,'2');assert.equal(filtered.totalPages,'2')
  assert.equal(filtered.items[0].id,income.id)
  assert.equal((await request('GET','financial-summary')).currentBalance,'87.66')
  const pot=await create('savings-pots',{name:'Smoke pot',targetAmount:'50.00',color:'#ABCDEF'})
  assert.equal(pot.balance,'0.00')
  await request('POST',`savings-pots/${pot.id}/deposits`,{amount:'60.00'})
  assert.equal((await request('POST',`savings-pots/${pot.id}/withdrawals`,{amount:'10.00'})).balance,'50.00')
  const deleted=await request('DELETE',`savings-pots/${pot.id}`)
  assert.equal(Date.parse(deleted.restoreUntil)-Date.parse(deleted.deletedAt),10_000)
  assert.equal((await request('GET','savings-pots')).items.length,0)
  assert.equal((await request('POST',`savings-pots/${pot.id}/restore`)).balance,'50.00')
  assert.equal((await request('POST',`savings-pots/${pot.id}/restore`)).balance,'50.00')
  const movements=(await request('GET','transactions?size=100')).items
  const withdrawal=movements.find(row=>row.potId === pot.id && row.amount === '-10.00')
  const deposit=movements.find(row=>row.potId === pot.id && row.amount === '60.00')
  await request('PUT',`transactions/${withdrawal.id}`,{name:'Corrected withdrawal',categoryId:null,transactionDate:today,amount:'-15.00'})
  assert.equal((await request('GET',`savings-pots/${pot.id}`)).balance,'45.00')
  await request('DELETE',`transactions/${deposit.id}`,undefined,409)
  await request('DELETE',`transactions/${withdrawal.id}`,undefined,204)
  assert.equal((await request('GET',`savings-pots/${pot.id}`)).balance,'60.00')
  const recurring=await create('recurring-payments',{name:'Smoke installments',categoryId:category.id,type:'INSTALLMENT',amount:'5.01',firstDueDate:today,totalInstallments:'2'})
  const paid=await request('PUT',`recurring-payments/${recurring.id}/payments/${month}`)
  const repeated=await request('PUT',`recurring-payments/${recurring.id}/payments/${month}`)
  assert.equal(paid.transaction.id,repeated.transaction.id)
  await request('PUT',`transactions/${paid.transaction.id}`,{name:'Corrected income',categoryId:category.id,transactionDate:today,amount:'5.01'})
  assert.equal((await request('GET',`recurring-payments/${recurring.id}?month=${month}`)).status,'VOID')
  const replacement=await request('PUT',`recurring-payments/${recurring.id}/payments/${month}`)
  assert.notEqual(replacement.transaction.id,paid.transaction.id)
  await request('PUT',`transactions/${paid.transaction.id}`,{name:'Collision',categoryId:category.id,transactionDate:today,amount:'-5.01'},409)
  const totals=await request('GET',`recurring-payments/summary?month=${month}`)
  assert.equal(totals.paid.count,'1');assert.equal(totals.paid.totalAmount,'5.01')
  const count=(await request('GET','transactions')).totalElements
  await request('PUT','financial-summary/settings',{frequency:'SEMIMONTHLY',startDay:'4'})
  assert.equal((await request('GET','financial-summary/settings')).frequency,'SEMIMONTHLY')
  assert.equal((await request('GET','transactions')).totalElements,count)
  await request('DELETE',`categories/${category.id}`,undefined,409)
  await request('DELETE',`budgets/${budget.id}`,undefined,204)
  await request('DELETE',`recurring-payments/${recurring.id}`,undefined,204)
  assert.equal((await request('GET',`recurring-payments/summary?month=${month}`)).paid.count,'1')
  await request('PUT',`categories/${category.id}`,{name:'Renamed history'})
  await request('DELETE',`categories/${category.id}`,undefined,204)
  assert.equal((await request('GET',`transactions?categoryId=${category.id}`)).totalElements,'4')
  const historical=await request('GET',`transactions/${expense.id}`)
  assert.equal(historical.categoryName,'Renamed history')
  await request('PUT',`transactions/${expense.id}`,{name:'Historical correction',categoryId:category.id,transactionDate:today,amount:'-13.00'})
  for(const name of ['Exact one','Exact two']) {
    const exact=await create('savings-pots',{name,targetAmount:'99999999999999999.99',color:'#277C78'})
    assert.equal((await request('POST',`savings-pots/${exact.id}/deposits`,{amount:'99999999999999999.99'})).balance,'99999999999999999.99')
  }
  assert.equal((await request('GET','savings-pots')).totalBalance,'200000000000000059.98')
  await page.goto(origin+'/finance');await expect(page.locator('main')).toContainText('$200,000,000,000,000,059.98')
  for(const route of ['categories','transactions','budgets','pots','recurring-bills']) {
    await page.goto(origin+'/finance/'+route);await expect(page.getByRole('button',{name:'Logout',exact:true})).toBeVisible()
  }
  const second=await browser.newContext({baseURL:origin})
  try {
    await authenticate(second)
    assert.deepEqual((await request('GET','categories',undefined,200,second)).items,[])
    await request('GET',`savings-pots/${pot.id}`,undefined,404,second)
    const html=await(await second.request.get(origin+'/finance/transactions')).text()
    assert.ok(!html.includes('Historical correction'))
  } finally {await second.close()}
  console.log('PASS: real Spring financial CRUD, filters, CSRF, precision, linked corrections, undo, recurring idempotency/VOID, historical categories, periods and account isolation.')
} catch(error) {
  primaryError=error
  throw error
} finally {
  try {
    if(authenticated) {
    for(const id of ids.budgets)await request('DELETE',`budgets/${id}`,undefined,204).catch(()=>{})
    for(const id of ids.recurring)await request('DELETE',`recurring-payments/${id}`,undefined,204).catch(()=>{})
    const history=await request('GET','transactions?size=100&sort=amount_asc')
    for(const row of history.items)await request('DELETE',`transactions/${row.id}`,undefined,204)
    for(const id of ids.pots)await request('DELETE',`savings-pots/${id}`).catch(()=>{})
    for(const id of ids.categories)await request('DELETE',`categories/${id}`,undefined,204).catch(()=>{})
    }
  } catch(error) {
    if(!primaryError)throw error
    console.warn('Financial cleanup could not finish; dispose of the isolated test database.')
  } finally {await context.close();await browser.close()}
}
