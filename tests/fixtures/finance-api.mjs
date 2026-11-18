import { isLosslessNumber, LosslessNumber, parse, stringify } from 'lossless-json'

const accounts=new Map()
const today='2027-03-20',currentMonth='2027-03'
const numeric=new Set(['id','categoryId','potId','recurringPaymentId','occurrenceId','budgetId','amount','spendingLimit','targetAmount','balance','totalBalance','currentBalance','income','expenses','spent','available','exceededAmount','totalAmount','paidAmount','totalElements','totalPages','count','paidInstallments'])
const cents=value=>{const [whole,fraction='']=String(value).replace('-','').split('.');return (BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0')))*(String(value).startsWith('-')?-1n:1n)}
const money=value=>{const abs=value<0n?-value:value;return `${value<0n?'-':''}${abs/100n}.${String(abs%100n).padStart(2,'0')}`}
const encode=value=>stringify(value,(key,item)=>item !== null && numeric.has(key) ? new LosslessNumber(String(item)) : item)
const decode=body=>parse(body,(key,value)=>isLosslessNumber(value) ? value.value : value)
function account(email) {
  if(!accounts.has(email)) accounts.set(email,{next:1n,categories:[],transactions:[],budgets:[],pots:[],recurring:[],occurrences:[],settings:{frequency:'MONTHLY',startDay:1}})
  return accounts.get(email)
}
export function handleFinance(req,res,session,body) {
  const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(data === undefined?'':encode(data))}
  if(!session?.email)return send(401)
  const db=account(session.email),url=new URL(req.url,'http://fixture'),[resource,id,action,monthArg]=url.pathname.replace(/^\/api\//,'').split('/'),method=req.method
  const next=()=>String(db.next++)
  const problem=(status,field)=>send(status,{status,errors:field?[{field}]:[]})
  if(url.pathname === '/__finance/next-id') {db.next=BigInt(JSON.parse(body).id);return send(204)}
  if(method !== 'GET' && req.headers['x-csrf-token'] !== session.token && !url.pathname.startsWith('/__finance/'))return send(403)
  let data={}
  try {if(body)data=decode(body)}catch{return problem(400)}
  const active=list=>list.filter(row=>!row.deleted)
  const effective=()=>active(db.transactions).filter(row=>row.potId === null || active(db.pots).some(pot=>pot.id === row.potId))
  const categoryName=key=>db.categories.find(row=>row.id === key)?.name ?? null
  const txView=row=>({...row,categoryName:categoryName(row.categoryId),budgetWarnings:[]})
  const newTx=(name,categoryId,amount,sourceType='MANUAL',potId=null,recurringPaymentId=null,occurrenceId=null)=>{
    const row={id:next(),name,categoryId,categoryName:categoryName(categoryId),transactionDate:today,amount,sourceType,potId,potName:db.pots.find(pot=>pot.id === potId)?.name ?? null,recurringPaymentId,occurrenceId,openingBalance:false,budgetWarnings:[]}
    db.transactions.push(row);return row
  }
  const selectedMonth=url.searchParams.get('month') || currentMonth
  const budgetView=(row,month=selectedMonth)=>{
    const spent=effective().filter(tx=>tx.categoryId === row.categoryId && tx.transactionDate.startsWith(month) && cents(tx.amount)<0n).reduce((sum,tx)=>sum-cents(tx.amount),0n),limit=cents(row.spendingLimit)
    return {...row,categoryName:categoryName(row.categoryId),month,spent:money(spent),available:money(limit-spent),limitReached:spent>=limit,exceededAmount:money(spent>limit?spent-limit:0n)}
  }
  const warnings=row=>active(db.budgets).filter(budget=>budget.categoryId === row.categoryId).map(budget=>budgetView(budget,row.transactionDate.slice(0,7))).filter(budget=>budget.limitReached).map(({id:budgetId,categoryId,month,limitReached,exceededAmount})=>({budgetId,categoryId,month,limitReached,exceededAmount}))
  const occurrence=(row,month)=>db.occurrences.find(item=>item.recurringPaymentId === row.id && item.month === month)
  const scheduled=(row,month)=>{const [year,m]=month.split('-').map(Number),[firstYear,firstMonth]=row.firstDueDate.split('-').map(Number),index=(year-firstYear)*12+m-firstMonth;return index>=0 && index%row.intervalMonths===0 && (row.type === 'SUBSCRIPTION' || index<row.totalInstallments)}
  const recurringView=(row,month=selectedMonth)=>{
    const paid=occurrence(row,month),day=Math.min(row.billingDay,new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5)),0)).getUTCDate()),dueDate=paid || scheduled(row,month)?month+'-'+String(day).padStart(2,'0'):null
    return {...row,categoryName:categoryName(row.categoryId),paidInstallments:String(db.occurrences.filter(item=>item.recurringPaymentId === row.id && item.status === 'PAID').length),month,dueDate,status:paid?.status ?? (dueDate?'PENDING':'NOT_SCHEDULED'),occurrenceId:paid?.id ?? null,paidAmount:paid?.amount ?? null,paidAt:paid?.paidAt ?? null}
  }
  const pay=(row,month)=>{
    if(!scheduled(row,month))return null
    let paid=occurrence(row,month)
    if(paid?.status === 'PAID')return { ...paid,occurrenceId:paid.id,transaction:txView(db.transactions.find(tx=>tx.id === paid.transactionId)),budgetWarnings:[] }
    paid ??= {id:next(),recurringPaymentId:row.id,month};if(!db.occurrences.includes(paid))db.occurrences.push(paid)
    const tx=newTx(row.name,row.categoryId,money(-cents(row.amount)),'RECURRING_PAYMENT',null,row.id,paid.id)
    Object.assign(paid,{status:'PAID',paidAt:new Date().toISOString(),amount:row.amount,transactionId:tx.id})
    return {...paid,occurrenceId:paid.id,transaction:txView(tx),budgetWarnings:warnings(tx)}
  }
  if(url.pathname === '/__finance/job') {for(const row of active(db.recurring))if(scheduled(row,currentMonth) && !occurrence(row,currentMonth))pay(row,currentMonth);return send(204)}
  if(resource === 'financial-summary') {
    if(id === 'settings') {if(method === 'PUT') db.settings={frequency:data.frequency,startDay:Number(data.startDay)};return send(200,db.settings)}
    const start=db.settings.startDay,semi=db.settings.frequency === 'SEMIMONTHLY',day=semi && start<=5 && Number(today.slice(8))>=start+15?start+15:start
    const periodStart=`2027-03-${String(Math.min(day,31)).padStart(2,'0')}`,periodEnd=semi && day === start?`2027-03-${String(start+14).padStart(2,'0')}`:start === 1?'2027-03-31':`2027-04-${String(start-1).padStart(2,'0')}`
    const rows=effective().filter(tx=>tx.transactionDate>=periodStart && tx.transactionDate<=periodEnd),income=rows.filter(tx=>cents(tx.amount)>0n).reduce((sum,tx)=>sum+cents(tx.amount),0n),expenses=rows.filter(tx=>cents(tx.amount)<0n).reduce((sum,tx)=>sum-cents(tx.amount),0n)
    return send(200,{periodStart,periodEnd,income:money(income),expenses:money(expenses),currentBalance:money(income-expenses)})
  }
  if(resource === 'recurring-payments' && id === 'summary') {
    const paidRows=db.occurrences.filter(row=>row.month === selectedMonth && row.status === 'PAID'),pending=active(db.recurring).map(row=>recurringView(row)).filter(row=>row.dueDate && row.status !== 'PAID'),soon=pending.filter(row=>row.dueDate>=today && row.dueDate<='2027-03-27')
    const group=rows=>({count:String(rows.length),totalAmount:money(rows.reduce((sum,row)=>sum+cents(row.amount),0n))})
    return send(200,{month:selectedMonth,paid:group(paidRows),pending:group(pending),dueSoon:group(soon),total:group([...paidRows,...pending])})
  }
  const collection={categories:db.categories,transactions:db.transactions,budgets:db.budgets,'savings-pots':db.pots,'recurring-payments':db.recurring}[resource]
  if(!collection)return send(404)
  let row=id?collection.find(item=>item.id === id):undefined
  if(id && !row)return send(404)
  if(row?.deleted && !(resource === 'savings-pots' && ['DELETE','POST'].includes(method)))return send(404)
  if(resource === 'savings-pots' && action) {
    if(action === 'restore') {if(row.deleted && Date.now()>=Date.parse(row.restoreUntil))return problem(409);delete row.deleted;return send(200,row)}
    if(row.deleted)return send(404)
    if(!data.amount || cents(data.amount)<=0n)return problem(400,'amount')
    const amount=cents(data.amount)*(action === 'withdrawals'?-1n:1n),balance=cents(row.balance)+amount
    if(balance<0n || balance>9999999999999999999n)return problem(409)
    row.balance=money(balance);newTx(row.name,null,money(amount),'POT',row.id);return send(200,row)
  }
  if(resource === 'recurring-payments' && action === 'payments') {const result=pay(row,monthArg);return result?send(200,result):problem(409)}
  if(method === 'DELETE') {
    if(resource === 'categories' && [...active(db.budgets),...active(db.recurring)].some(item=>item.categoryId === id))return problem(409)
    if(resource === 'transactions') {
      if(row.potId) {const pot=db.pots.find(pot=>pot.id === row.potId),balance=cents(pot.balance)-cents(row.amount);if(balance<0n)return problem(409);pot.balance=money(balance)}
      if(row.occurrenceId) db.occurrences.find(item=>item.id === row.occurrenceId).status='VOID'
    }
    row.deleted=true
    if(resource === 'savings-pots') {row.deletedAt ??= new Date().toISOString();row.restoreUntil ??= new Date(Date.parse(row.deletedAt)+10_000).toISOString();return send(200,{id,deletedAt:row.deletedAt,restoreUntil:row.restoreUntil})}
    return send(204)
  }
  if(method === 'POST' || method === 'PUT') {
    const name=data.name?.trim()
    if(resource !== 'budgets' && (!name || name.length>100))return problem(400,'name')
    if(['transactions','budgets','recurring-payments'].includes(resource) && data.categoryId !== null && !active(db.categories).some(cat=>cat.id === data.categoryId) && row?.categoryId !== data.categoryId)return problem(400,'categoryId')
    if(resource === 'budgets' && active(db.budgets).some(item=>item.id !== id && item.categoryId === data.categoryId))return problem(409)
    if(resource === 'recurring-payments') {
      const interval=Number(data.intervalMonths ?? 1)
      if(!Number.isInteger(interval) || interval<1 || interval>12 || data.type === 'INSTALLMENT' && interval !== 1)return problem(400,'intervalMonths')
    }
    if(resource === 'transactions') {
      if(row?.occurrenceId && cents(data.amount)<0n && effective().some(item=>item.id !== row.id && item.occurrenceId === row.occurrenceId && cents(item.amount)<0n))return problem(409)
      if(row?.potId) {const pot=db.pots.find(pot=>pot.id === row.potId),balance=cents(pot.balance)+cents(data.amount)-cents(row.amount);if(balance<0n || balance>9999999999999999999n)return problem(409);pot.balance=money(balance)}
      if(row?.occurrenceId) {const paid=db.occurrences.find(item=>item.id === row.occurrenceId);paid.status=cents(data.amount)<0n?'PAID':'VOID';paid.amount=money(cents(data.amount)<0n?-cents(data.amount):cents(data.amount))}
    }
    if(resource === 'recurring-payments' && row && db.occurrences.some(item=>item.recurringPaymentId === id) && (data.firstDueDate.slice(0,7) !== row.firstDueDate.slice(0,7)))return problem(409)
    if(!row) {
      row=resource === 'transactions'?newTx(name,data.categoryId,data.amount):{id:next()}
      if(resource !== 'transactions')collection.push(row)
      if(resource === 'savings-pots')row.balance='0.00'
    }
    Object.assign(row,data,...(name?[{name}]:[]))
    if(resource === 'recurring-payments')Object.assign(row,{totalInstallments:row.type === 'SUBSCRIPTION'?null:Number(row.totalInstallments),intervalMonths:Number(data.intervalMonths ?? 1),billingDay:Number(row.firstDueDate.slice(8))})
    return send(method === 'POST'?201:200,resource === 'budgets'?budgetView(row):resource === 'recurring-payments'?recurringView(row):resource === 'transactions'?{...txView(row),budgetWarnings:warnings(row)}:row)
  }
  if(row)return send(200,resource === 'budgets'?budgetView(row):resource === 'recurring-payments'?recurringView(row):resource === 'transactions'?txView(row):row)
  if(['transactions','recurring-payments'].includes(resource)) {
    const search=(url.searchParams.get('search') ?? '').toLowerCase(),sort=url.searchParams.get('sort') ?? 'newest',page=Number(url.searchParams.get('page') ?? 0),size=Number(url.searchParams.get('size') ?? 20)
    let rows=resource === 'transactions'?effective().map(txView):active(db.recurring).filter(row=>scheduled(row,selectedMonth) || occurrence(row,selectedMonth)).map(row=>recurringView(row))
    rows=rows.filter(row=>row.name.toLowerCase().includes(search) && (!url.searchParams.get('categoryId') || row.categoryId === url.searchParams.get('categoryId')))
    const compare=(a,b)=>a<b?-1:a>b?1:0
    rows.sort((a,b)=>{const result=sort.startsWith('name_')?a.name.toLowerCase().localeCompare(b.name.toLowerCase()):sort.startsWith('amount_')?compare(cents(a.amount),cents(b.amount)):compare(a.transactionDate ?? a.dueDate,b.transactionDate ?? b.dueDate);const tie=result || compare(BigInt(a.id),BigInt(b.id));return ['newest','name_desc','amount_desc'].includes(sort)?-tie:tie})
    return send(200,{items:rows.slice(page*size,(page+1)*size),page,size,totalElements:String(rows.length),totalPages:String(Math.ceil(rows.length/size))})
  }
  if(resource === 'budgets')return send(200,{items:active(collection).map(row=>budgetView(row))})
  if(resource === 'savings-pots')return send(200,{items:active(collection),totalBalance:money(active(collection).reduce((sum,pot)=>sum+cents(pot.balance),0n))})
  return send(200,{items:active(collection)})
}
