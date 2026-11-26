'use client'
import { FieldSkeleton } from './Loading'

import { useId } from 'react'
import { useQuery } from '@tanstack/react-query'
import { validId } from '@/lib/api/finance-json'
import { ApiError } from '@/lib/api/client'
import { useFinance } from '@/lib/finance/AccountScope'
import { categoryOptions } from '@/lib/finance/categories'
import { colorHex } from '@/lib/finance/colors'
import { useI18n } from '@/lib/i18n/client'
import { SelectColorTag } from '@/components/ui/SelectColorTag'
import { colorTags } from '@/lib/utils'
import { FormSelect, QueryMessage, useCategoryView } from './common'

export function validate(fields: Record<string, boolean>) {
  const invalid = Object.keys(fields).filter(key => !fields[key])
  if (invalid.length) throw new ApiError(400, invalid)
}

export function nameValid(name: string) { return name.trim().length > 0 && name.trim().length <= 100 }

export function useFieldError(error: unknown) {
  const { t } = useI18n()
  return (field: string) => {
    if (!(error instanceof ApiError) || !error.fields.includes(field)) return
    if (field === 'name') return t('Review your name (1–100 characters).')
    if (['amount', 'spendingLimit', 'targetAmount'].includes(field)) return t('Enter a valid amount, up to 17 digits and 2 decimals.')
    return t('Please review the marked fields.')
  }
}

export function CategoryField({ value, onChange, original, error, nullable = false, excludedIds }: { value: string; onChange: (value: string) => void; original?: { id: string; name: string }; error?: string; nullable?: boolean; excludedIds?: ReadonlySet<string> }) {
  const { queries } = useFinance()
  const query = useQuery(queries.categories())
  const { t } = useI18n()
  const categories = useCategoryView(query.data)
  const options = categoryOptions(categories?.filter(category => validId(category.id)) ?? []).filter(option => !excludedIds?.has(option.value))
  if (original && !options.some(option => option.value === original.id)) options.push({ value: original.id, label: `${original.name} (${t('Inactive category')})` })
  if (nullable) options.unshift({ value: 'none', label: t('No category') })
  return <>
    <QueryMessage query={query} fallback={<FieldSkeleton/>}/>
    {(!query.isPending || original) && <FormSelect label="Category" value={value} onChange={onChange} options={options} error={error}/>}
    {query.data && !options.length && <p className="text-preset-5">{t(excludedIds?.size ? 'No categories available for a budget.' : 'Choose an active category.')}</p>}
  </>
}

export function ColorField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const id = useId(), { t } = useI18n()
  return <div className="grid gap-50"><label htmlFor={id} className="text-preset-5-bold text-grey-500">{t('Color Tag')}</label><SelectColorTag id={id} value={value} onValueChange={onChange} options={colorTags.map(option => ({ ...option, value: colorHex[option.value] }))} /></div>
}

export function AmountHelp() { return <p className="text-preset-5 text-grey-500">{useI18n().t('Use a decimal point without thousands separators.')}</p> }
