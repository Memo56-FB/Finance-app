'use client'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Funnel, SortAscending } from '@phosphor-icons/react/dist/ssr'
import { Separator } from '@/components/ui/separator'
import { InputSearch } from '@/components/ui/InputSearch'
import { ResponsiveSelect } from '@/components/ui/ResponsiveSelect'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { CalendarDate, Money, useI18n } from '@/lib/i18n/client'
import { useFinance } from '@/lib/finance/AccountScope'
import { filtersFromURL } from '@/lib/finance/queries'
import { validId } from '@/lib/api/finance-json'
import type { Transaction } from '@/lib/finance/types'
import { categoryOptions, DeleteForm, TransactionForm } from './forms'
import { Empty, financeDialog, NewDialog, PageHeader, QueryMessage, RowActions } from './common'

export function useFinancialURL() {
  const current=useSearchParams()
  const text=current.toString()
  const params=useMemo(()=>new URLSearchParams(text),[text])
  const update=useCallback((key:string,value:string) => { const next=new URLSearchParams(text);if(value)next.set(key,value);else next.delete(key);if(key !== 'page')next.set('page','1');window.history.replaceState(null,'','?'+next) },[text])
  return {params,update}
}
export function ListToolbar({category=false}:{category?:boolean}) {
  const {queries}=useFinance(),categories=useQuery({...queries.categories(),enabled:category}),{params,update}=useFinancialURL(),{t}=useI18n()
  const urlQuery=params.get('query') ?? '',[search,setSearch]=useState({urlQuery,value:urlQuery})
  if(search.urlQuery !== urlQuery) setSearch({urlQuery,value:urlQuery})
  const sort=filtersFromURL(params).sort!
  const sorts=[['newest','Latest'],['oldest','Oldest'],['name_asc','A to Z'],['name_desc','Z to A'],['amount_desc','Highest'],['amount_asc','Lowest']] as const
  const selected=params.get('category') ?? ''
  const options=[{value:'all',label:t('All categories')},...categoryOptions(categories.data?.items ?? [])]
  if(validId(selected) && !options.some(option=>option.value === selected)) options.push({value:selected,label:`${t('Inactive category')} (#${selected})`})
  return <><div className="flex items-center justify-between gap-300"><InputSearch aria-label={t(category ? 'Search transactions' : 'Search bills')} placeholder={t(category ? 'Search transaction' : 'Search bills')} value={search.value} onChange={event=>{const value=event.target.value;setSearch({urlQuery,value});update('query',value)}}/><div className="flex shrink-0 gap-300"><ResponsiveSelect label={t('Sort By')} value={sort} onValueChange={value=>update('sortBy',value)} options={sorts.map(([value,label])=>({value,label:t(label)}))}><SortAscending size={20} weight="fill" className="text-grey-900"/></ResponsiveSelect>{category && <ResponsiveSelect label={t('Category')} value={validId(selected) ? selected : 'all'} onValueChange={value=>update('category',value === 'all' ? '' : value)} options={options}><Funnel size={20} weight="fill" className="text-grey-900"/></ResponsiveSelect>}</div></div>{category && <QueryMessage query={categories}/>}</>
}
export function PagedNavigation({data}:{data:{page:number;totalPages:string}}) {
  const {params,update}=useFinancialURL()
  const total=BigInt(data.totalPages),pages=Number(total > 2147483647n ? 2147483647n : total) || 1
  const page=Math.min(data.page+1,pages)
  useEffect(()=>{if(data.page+1 > pages)update('page',String(pages))},[data.page,pages,update])
  const href=(value:number) => { const next=new URLSearchParams(params);next.set('page',String(value));return '?'+next }
  const visible=[1,page-1,page,page+1,pages].filter((value,index,all)=>value >= 1 && value <= pages && all.indexOf(value) === index).sort((a,b)=>a-b)
  return <Pagination><PaginationContent className="w-full flex-wrap"><PaginationItem className="mr-auto"><PaginationPrevious href={href(page-1)} disabled={page <= 1}/></PaginationItem>{visible.map(value=><PaginationItem key={value}><PaginationLink href={href(value)} isActive={value === page}>{value}</PaginationLink></PaginationItem>)}<PaginationItem className="ml-auto"><PaginationNext href={href(page+1)} disabled={page >= pages}/></PaginationItem></PaginationContent></Pagination>
}
function Origin({row}:{row:Transaction}) {
  const {t}=useI18n()
  return <span className="text-preset-5 text-grey-500">{t(row.sourceType === 'POT' ? 'Pot movement' : row.sourceType === 'RECURRING_PAYMENT' ? 'Recurring payment' : 'Manual')}{row.potName ? ` · ${row.potName}` : ''}{row.openingBalance ? ` · ${t('Opening balance')}` : ''}</span>
}
export function TransactionRows({rows,actions=false,showCategory=false}:{rows:Transaction[];actions?:boolean;showCategory?:boolean}) {
  const {t}=useI18n()
  if(!rows.length)return <Empty label="No transactions found."/>
  if(!actions) return <div className={showCategory ? 'grid gap-150' : 'grid gap-250'}>{rows.map((row,index)=><Fragment key={row.id}>
    <article className="flex items-center justify-between gap-200">
      <div className="grid gap-50 min-w-0"><p className="text-preset-4-bold text-grey-900 break-words [overflow-wrap:anywhere]">{row.name}</p>{showCategory && <p className="text-preset-5 text-grey-500 break-words">{row.categoryName ?? t('No category')}</p>}</div>
      <div className="grid gap-100 text-right min-w-0"><p className={`text-preset-4-bold break-all ${!showCategory && !row.amount.startsWith('-') ? 'text-green' : 'text-grey-900'}`}><Money value={row.amount} signed/></p><p className="text-preset-5 text-grey-500"><CalendarDate value={row.transactionDate}/></p></div>
    </article>{index < rows.length-1 && <Separator className="bg-grey-100"/>}
  </Fragment>)}</div>
  return <div role="table" aria-label={t('Transactions')} className="grid gap-300">
    <div role="row" className="sr-only md:not-sr-only md:grid md:grid-cols-[repeat(6,minmax(0,1fr))_44px] md:gap-400 md:py-150 md:border-b md:border-grey-100 text-preset-5 text-grey-500">
      <span role="columnheader" className="col-span-3">{t('Name')}</span><span role="columnheader">{t('Category')}</span><span role="columnheader">{t('Transaction Date')}</span><span role="columnheader">{t('Amount')}</span><span role="columnheader" className="sr-only">{t('Actions')}</span>
    </div>
    <div role="rowgroup">{rows.map(row=><article role="row" key={row.id} className="grid grid-cols-[minmax(0,1fr)_auto_44px] items-center gap-150 py-200 first:pt-0 last:pb-0 border-b border-grey-100 last:border-b-0 md:grid-cols-[repeat(6,minmax(0,1fr))_44px] md:gap-400">
      <div role="cell" className="grid gap-50 min-w-0 md:col-span-3"><p className="text-preset-4-bold text-grey-900 break-words [overflow-wrap:anywhere]">{row.name}</p><p className="text-preset-5 text-grey-500 md:hidden">{row.categoryName ?? t('No category')}</p><span className="sr-only"><Origin row={row}/></span></div>
      <p role="cell" className="hidden md:block text-preset-5 text-grey-500 break-words">{row.categoryName ?? t('No category')}</p>
      <p role="cell" className="hidden md:block text-preset-5 text-grey-500"><CalendarDate value={row.transactionDate}/></p>
      <div role="cell" className="grid gap-50 text-right min-w-0 md:text-left"><p className="text-preset-4-bold text-grey-900 break-all"><Money value={row.amount} signed/></p><p className="text-preset-5 text-grey-500 md:hidden"><CalendarDate value={row.transactionDate}/></p></div>
      <div role="cell"><RowActions name={row.name} recordId={row.id} contentClassName={financeDialog} edit={done=><TransactionForm record={row} onDone={done}/>} remove={done=><DeleteForm resource="transactions" id={row.id} onDone={done}/>}/></div>
    </article>)}</div>
  </div>
}
export function Transactions() {
  const {queries}=useFinance(),{params}=useFinancialURL(),filters=filtersFromURL(params),query=useQuery(queries.transactions(filters))
  useEffect(()=>{const category=params.get('category');if(category && !validId(category)){const next=new URLSearchParams(params);next.delete('category');next.set('page','1');window.history.replaceState(null,'','?'+next)}},[params])
  return <><PageHeader title="Transactions"><NewDialog title="Add transaction">{done=><TransactionForm onDone={done}/>}</NewDialog></PageHeader><section className="bg-white mt-400 px-250 py-300 rounded-xl grid gap-300"><ListToolbar category/><QueryMessage query={query}/>{query.data && <><TransactionRows rows={query.data.items} actions/><PagedNavigation data={query.data}/></>}</section></>
}
