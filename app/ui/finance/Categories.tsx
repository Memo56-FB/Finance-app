'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { ControlledLabel, useI18n } from '@/lib/i18n/client'
import { useFinance } from '@/lib/finance/AccountScope'
import { useState } from 'react'
import { saveRecord } from '@/lib/finance/services'
import type { Category } from '@/lib/finance/types'
import { FormInput, SaveForm, useSave } from './common'
import { nameValid, useFieldError, validate } from './form-fields'
import { DeleteForm } from './DeleteForm'
import { Empty, NewDialog, PageHeader, panel, QueryMessage, RowActions } from './common'

export function Categories() {
  const {queries}=useFinance(),query=useQuery(queries.categories()),{t}=useI18n()
  return <><PageHeader title="Categories"><NewDialog title="Add category">{<CategoryForm/>}</NewDialog></PageHeader><section className={panel}><QueryMessage query={query}/>
    {query.data && (query.data.items.length ? <table className="w-full text-left text-preset-4"><thead className="border-b border-grey-100 text-grey-500"><tr><th className="py-150">{t('Name')}</th><th className="w-12"><span className="sr-only">{t('Actions')}</span></th></tr></thead><tbody>{query.data.items.map(category=><tr key={category.id} className="border-b border-grey-100 last:border-none"><td className="py-200 break-words [overflow-wrap:anywhere]">{category.name}</td><td><RowActions name={category.name} recordId={category.id} edit={<CategoryForm record={category}/>} remove={<DeleteForm resource="categories" id={category.id}/>}/></td></tr>)}</tbody></table> : <Empty label="No categories yet."/>)}
  </section></>
}
export function GuestCategories() {
  const {t}=useI18n()
  return <><PageHeader title="Categories"><Button disabled title={t('Log in to save changes.')} className="text-white">+ {t('Add category')}</Button></PageHeader><section className={panel}><table className="w-full text-left text-preset-4"><thead><tr><th className="py-150">{t('Name')}</th><th><span className="sr-only">{t('Actions')}</span></th></tr></thead><tbody>{['Bills','Groceries','General'].map(name=><tr key={name} className="border-t border-grey-100"><td className="py-200"><ControlledLabel value={name}/></td><td className="text-right"><button disabled aria-label={`${t('Actions')}: ${name}`} title={t('Log in to save changes.')} className="min-h-[44px] min-w-[44px]">•••</button></td></tr>)}</tbody></table><Link href="/login" className="text-preset-5 underline">{t('Log in to save changes.')}</Link></section></>
}

function CategoryForm({ record }: { record?: Category }) {
  const [name, setName] = useState(record?.name ?? '')
  const save = useSave(async () => { validate({ name: nameValid(name) }); return saveRecord('categories', { name: name.trim() }, record?.id) })
  const error = useFieldError(save.error)
  return <SaveForm save={save}><FormInput label="Name" value={name} onChange={event => setName(event.target.value)} maxLength={100} error={error('name')} required /></SaveForm>
}
