import { expect, it, vi } from 'vitest'
import { categoryOptions } from '@/app/ui/finance/forms'
import { financialRow, page, calendarDate } from './contracts'
import { filtersFromURL, financeQueries } from './queries'
import { recentExpenses } from './recent-expenses'
import { financialServices } from './services'
import type { Transaction } from './types'

const tx=(id:string,date:string,amount:string):Transaction=>({id,name:'Bills',categoryId:'1',categoryName:'Bills',transactionDate:date,amount,sourceType:'MANUAL',potId:null,potName:null,recurringPaymentId:null,occurrenceId:null,openingBalance:false,budgetWarnings:[]})
it('validates resource shapes, calendar dates, metadata and category identity',()=>{
  expect(categoryOptions([{id:'1',name:'Bills'},{id:'2',name:'Bills'}])).toEqual([{value:'1',label:'Bills (#1)'},{value:'2',label:'Bills (#2)'}])
  expect(financialRow.categories({id:'9007199254740993',name:'Bills'}).name).toBe('Bills')
  expect(()=>financialRow.categories({name:'missing id'})).toThrow()
  expect(()=>financialRow.transactions({...tx('1','2027-03-20','1'),sourceType:'OTHER'})).toThrow()
  expect(calendarDate('2027-02-29')).toBe(false)
  expect(calendarDate('2028-02-29')).toBe(true)
  expect(()=>page({items:[],page:0,size:0,totalPages:'0',totalElements:'0'},financialRow.categories)).toThrow()
})
it('normalizes URL filters and separates every account and parameter combination',()=>{
  expect(filtersFromURL(new URLSearchParams('category=Bills&page=-1&sortBy=Highest'))).toEqual({search:'',sort:'amount_desc',page:0,size:4})
  expect(filtersFromURL(new URLSearchParams('category=9007199254740993&page=2&query=Name'))).toMatchObject({categoryId:'9007199254740993',page:1,search:'Name'})
  expect(financeQueries('a').pots().queryKey).not.toEqual(financeQueries('b').pots().queryKey)
  expect(financeQueries('a').transactions({page:0}).queryKey).not.toEqual(financeQueries('a').transactions({page:1}).queryKey)
})
it('accepts subscription intervals and rejects invalid or nonmonthly installments',()=>{
  const row={id:'1',name:'Streaming',categoryId:'1',categoryName:'Bills',type:'SUBSCRIPTION',amount:'30.00',firstDueDate:'2027-01-31',billingDay:31,totalInstallments:null,intervalMonths:3,paidInstallments:'0',month:'2027-04',dueDate:'2027-04-30',status:'PENDING',occurrenceId:null,paidAmount:null,paidAt:null}
  for(const intervalMonths of [1,3,12]) expect(financialRow['recurring-payments']({...row,intervalMonths}).intervalMonths).toBe(intervalMonths)
  for(const intervalMonths of [undefined,null,'3',0,13,1.5]) expect(()=>financialRow['recurring-payments']({...row,intervalMonths})).toThrow()
  expect(()=>financialRow['recurring-payments']({...row,type:'INSTALLMENT',totalInstallments:12})).toThrow()
  expect(financialRow['recurring-payments']({...row,type:'INSTALLMENT',totalInstallments:12,intervalMonths:1}).intervalMonths).toBe(1)
})
it('finds three monthly expenses beyond income and future-date pages, stopping at older months',async()=>{
  const source=financialServices(vi.fn())
  source.transactions=vi.fn()
    .mockResolvedValueOnce({items:[tx('6','2027-04-01','-5'),tx('5','2027-03-30','10')],totalPages:'4'})
    .mockResolvedValueOnce({items:[tx('4','2027-03-25','-1'),tx('3','2027-03-20','-2')],totalPages:'4'})
    .mockResolvedValueOnce({items:[tx('2','2027-03-01','-3'),tx('1','2027-02-28','-4')],totalPages:'4'})
  expect((await recentExpenses('1','2027-03',undefined,source)).map(row=>row.id)).toEqual(['4','3','2'])
  expect(source.transactions).toHaveBeenCalledTimes(3)
  expect(source.transactions).toHaveBeenCalledWith({categoryId:'1',sort:'newest',page:0,size:100},undefined)
  source.transactions=vi.fn().mockResolvedValue({items:[tx('1','2027-02-28','-4')],totalPages:'10'})
  expect(await recentExpenses('1','2027-03',undefined,source)).toEqual([])
  expect(source.transactions).toHaveBeenCalledOnce()
})
it('passes read paths and cancellation into explicit financial services',async()=>{
  const read=vi.fn().mockResolvedValue({items:[],page:1,size:4,totalElements:'0',totalPages:'0'})
  const source=financialServices(read),controller=new AbortController()
  await source.transactions({categoryId:'9007199254740993',search:'%_!',page:1,size:4},controller.signal)
  expect(read).toHaveBeenCalledWith('transactions?categoryId=9007199254740993&search=%25_%21&page=1&size=4',controller.signal)
  read.mockResolvedValue({items:[{name:'bad'}]})
  await expect(source.categories()).rejects.toMatchObject({status:502})
})
