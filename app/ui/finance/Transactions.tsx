'use client'
import { CalendarField } from './CalendarField'
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
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
import { calendarDate } from '@/lib/finance/contracts'
import { categoryOptions } from '@/lib/finance/categories'
import { validAmount } from '@/lib/finance/money'
import { saveRecord } from '@/lib/finance/services'
import { FormInput, FormSelect, SaveForm, useSave } from './common'
import { AmountHelp, CategoryField, nameValid, useFieldError, validate } from './form-fields'
import { DeleteForm } from './DeleteForm'
import { Empty, financeDialog, NewDialog, PageHeader, QueryMessage, RowActions } from './common'

export function useFinancialURL() {
  const current=useSearchParams()
  const text=current.toString()
  const params=useMemo(()=>new URLSearchParams(text),[text])
  const update = useCallback((key: string, value: string, pendingSearch?: string, pushPage = false) => {
    const next = new URLSearchParams(window.location.search)
    const apply = (name: string, input: string) => {
      if (input) next.set(name, input)
      else next.delete(name)
    }
    apply(key, value)
    const changedSearch = pendingSearch !== undefined && pendingSearch !== (next.get('query') ?? '')
    if (changedSearch) apply('query', pendingSearch)
    if (key !== 'page' || changedSearch) next.set('page', '1')
    const url = '?' + next
    if (url === window.location.search) return
    if (pushPage && !changedSearch) window.history.pushState(null, '', url)
    else window.history.replaceState(null, '', url)
  }, [])
  return { params, update }
}

export function useFinancialSearch() {
  const { params, update } = useFinancialURL()
  const urlQuery = params.get('query') ?? ''
  const [draft, setDraft] = useState({ source: urlQuery, text: urlQuery })
  if (draft.source !== urlQuery) setDraft({ source: urlQuery, text: urlQuery })
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pending = useRef<string | undefined>(undefined)
  const composing = useRef(false)

  useEffect(() => {
    function cancelSearch() {
      clearTimeout(timer.current)
      pending.current = undefined
      composing.current = false
    }
    function restore() {
      cancelSearch()
      const text = new URLSearchParams(window.location.search).get('query') ?? ''
      setDraft({ source: text, text })
    }
    function followLink(event: MouseEvent) {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null
      if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return
      // Next may still be loading the destination when the debounce would write to history.
      if (link.pathname !== window.location.pathname || link.origin !== window.location.origin) cancelSearch()
    }
    window.addEventListener('popstate', restore)
    document.addEventListener('click', followLink, true)
    return () => {
      cancelSearch()
      window.removeEventListener('popstate', restore)
      document.removeEventListener('click', followLink, true)
    }
  }, [])

  function enter(text: string) {
    setDraft({ source: urlQuery, text })
    clearTimeout(timer.current)
    pending.current = text
    if (composing.current) return
    const source = window.location.href
    timer.current = setTimeout(() => {
      pending.current = undefined
      if (window.location.href === source) update('query', text)
    }, 300)
  }

  return {
    params,
    applyFilter(key: string, value: string) {
      clearTimeout(timer.current)
      const search = composing.current ? undefined : pending.current
      if (!composing.current) pending.current = undefined
      update(key, value, search, key === 'page')
    },
    input: {
      value: draft.text,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => enter(event.target.value),
      onCompositionStart: () => {
        composing.current = true
        clearTimeout(timer.current)
      },
      onCompositionEnd: (event: React.CompositionEvent<HTMLInputElement>) => {
        composing.current = false
        enter(event.currentTarget.value)
      },
    },
  }
}
export function ListToolbar({category=false, search}:{category?:boolean;search:ReturnType<typeof useFinancialSearch>}) {
  const { queries, phase } = useFinance()
  const categories = useQuery({ ...queries.categories(), enabled: category && phase === 'active' })
  const { params, applyFilter: update, input } = search
  const { t } = useI18n()
  const sort=filtersFromURL(params).sort!
  const sorts=[['newest','Latest'],['oldest','Oldest'],['name_asc','A to Z'],['name_desc','Z to A'],['amount_desc','Highest'],['amount_asc','Lowest']] as const
  const selected=params.get('category') ?? ''
  const options=[{value:'all',label:t('All categories')},...categoryOptions(categories.data?.items ?? [])]
  if(validId(selected) && !options.some(option=>option.value === selected)) options.push({value:selected,label:`${t('Inactive category')} (#${selected})`})
  return <><div className="flex items-center justify-between gap-300"><InputSearch aria-label={t(category ? 'Search transactions' : 'Search bills')} placeholder={t(category ? 'Search transaction' : 'Search bills')} {...input}/><div className="flex shrink-0 gap-300"><ResponsiveSelect label={t('Sort By')} value={sort} onValueChange={value=>update('sortBy',value)} options={sorts.map(([value,label])=>({value,label:t(label)}))}><SortAscending size={20} weight="fill" className="text-grey-900"/></ResponsiveSelect>{category && <ResponsiveSelect label={t('Category')} value={validId(selected) ? selected : 'all'} onValueChange={value=>update('category',value === 'all' ? '' : value)} options={options}><Funnel size={20} weight="fill" className="text-grey-900"/></ResponsiveSelect>}</div></div>{category && <QueryMessage query={categories}/>}</>
}
export function PagedNavigation({data,applyFilter}:{data:{page:number;totalPages:string};applyFilter:(key:string,value:string)=>void}) {
  const {params,update}=useFinancialURL()
  const total=BigInt(data.totalPages),pages=Number(total > 2147483647n ? 2147483647n : total) || 1
  const page=Math.min(data.page+1,pages)
  useEffect(()=>{if(data.page+1 > pages)update('page',String(pages))},[data.page,pages,update])
  const href=(value:number) => { const next=new URLSearchParams(params);next.set('page',String(value));return '?'+next }
  const visible=[1,page-1,page,page+1,pages].filter((value,index,all)=>value >= 1 && value <= pages && all.indexOf(value) === index).sort((a,b)=>a-b)
  const link = (value: number, disabled = false) => ({
    href: href(value),
    prefetch: false as const,
    onNavigate(event: { preventDefault(): void }) {
      event.preventDefault()
      if (!disabled) applyFilter('page', String(value))
    },
  })
  return <Pagination><PaginationContent className="w-full flex-wrap">
    <PaginationItem className="mr-auto"><PaginationPrevious {...link(page-1, page <= 1)} disabled={page <= 1}/></PaginationItem>
    {visible.map(value=><PaginationItem key={value}><PaginationLink {...link(value)} isActive={value === page}>{value}</PaginationLink></PaginationItem>)}
    <PaginationItem className="ml-auto"><PaginationNext {...link(page+1, page >= pages)} disabled={page >= pages}/></PaginationItem>
  </PaginationContent></Pagination>
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
    <div role="rowgroup">{rows.map(row=><article role="row" key={row.id} className="grid grid-cols-[minmax(0,1fr)_auto_44px] items-center gap-x-150 gap-y-50 py-200 first:pt-0 last:pb-0 border-b border-grey-100 last:border-b-0 md:grid-cols-[repeat(6,minmax(0,1fr))_44px] md:gap-400">
      <div role="cell" className="min-w-0 md:col-span-3"><p className="text-preset-4-bold text-grey-900 break-words [overflow-wrap:anywhere]">{row.name}</p><span className="sr-only"><Origin row={row}/></span></div>
      <p role="cell" className="col-start-1 row-start-2 text-preset-5 text-grey-500 break-words md:col-start-4 md:row-start-1">{row.categoryName ?? t('No category')}</p>
      <p role="cell" className="col-start-2 row-start-2 text-right text-preset-5 text-grey-500 md:col-start-5 md:row-start-1 md:text-left"><CalendarDate value={row.transactionDate}/></p>
      <div role="cell" className="col-start-2 row-start-1 min-w-0 text-right md:col-start-6 md:text-left"><p className="text-preset-4-bold text-grey-900 break-all"><Money value={row.amount} signed/></p></div>
      <div role="cell" className="col-start-3 row-span-2 row-start-1 md:col-start-7 md:row-span-1"><RowActions name={row.name} recordId={row.id} contentClassName={financeDialog} edit={<TransactionForm record={row}/>} remove={<DeleteForm resource="transactions" id={row.id}/>}/></div>
    </article>)}</div>
  </div>
}
export function Transactions() {
  const search = useFinancialSearch()
  const {params}=search, {queries}=useFinance(), filters=filtersFromURL(params),query=useQuery(queries.transactions(filters))
  useEffect(()=>{const category=params.get('category');if(category && !validId(category)){const next=new URLSearchParams(params);next.delete('category');next.set('page','1');window.history.replaceState(null,'','?'+next)}},[params])
  return <><PageHeader title="Transactions"><NewDialog title="Add transaction">{<TransactionForm/>}</NewDialog></PageHeader><section className="bg-white mt-400 px-250 py-300 rounded-xl grid gap-300"><ListToolbar category search={search}/><QueryMessage query={query}/>{query.data && <><TransactionRows rows={query.data.items} actions/><PagedNavigation data={query.data} applyFilter={search.applyFilter}/></>}</section></>
}

function TransactionForm({ record }: { record?: Transaction }) {
  const { t } = useI18n()
  const nullable = record?.sourceType === 'POT'
  const [name, setName] = useState(record?.name ?? '')
  const [categoryId, setCategory] = useState(record?.categoryId ?? (nullable ? 'none' : ''))
  const [date, setDate] = useState(() => record?.transactionDate ?? format(new Date(), 'yyyy-MM-dd'))
  const [amount, setAmount] = useState(record?.amount.replace(/^-/, '') ?? '')
  const [sign, setSign] = useState(record?.amount.startsWith('-') || !record ? 'expense' : 'income')
  const save = useSave(async () => {
    validate({
      name: nameValid(name),
      categoryId: validId(categoryId) || nullable && categoryId === 'none',
      transactionDate: calendarDate(date),
      amount: validAmount(amount),
    })
    return saveRecord('transactions', {
      name: name.trim(),
      categoryId: categoryId === 'none' ? null : categoryId,
      transactionDate: date,
      amount: (sign === 'expense' ? '-' : '') + amount,
    }, record?.id)
  })
  const error = useFieldError(save.error)
  return <SaveForm save={save}>
    {record && <p><Origin row={record}/></p>}
    {record && record.sourceType !== 'MANUAL' && <p className="text-preset-4 text-grey-500">{t('This correction can change a linked pot balance or payment status.')}</p>}
    <FormInput label="Name" value={name} onChange={e => setName(e.target.value)} maxLength={100} error={error('name')} required />
    <CategoryField value={categoryId || (nullable ? 'none' : '')} onChange={setCategory} original={record?.categoryId ? { id: record.categoryId, name: record.categoryName ?? '' } : undefined} nullable={nullable} error={error('categoryId')} />
    <CalendarField label="Transaction Date" value={date} onChange={setDate} error={error('transactionDate')} />
    <FormSelect label="Transaction type" value={sign} onChange={setSign} options={[{ value: 'income', label: t('Income') }, { value: 'expense', label: t('Expense') }]} />
    <FormInput label="Amount" money inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} error={error('amount')} required /><AmountHelp />
  </SaveForm>
}
