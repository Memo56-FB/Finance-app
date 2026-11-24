'use client'
import { createContext, useContext, useEffect, useId, useRef, useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DotsThreeOutline } from '@phosphor-icons/react/dist/ssr'
import { useI18n } from '@/lib/i18n/client'
import type { Messages } from '@/lib/i18n'
import { ApiError } from '@/lib/api/client'
import { SessionRetry, useFinance, useAccountSession } from '@/lib/finance/AccountScope'
import { financeKey, recentTransactionFilters } from '@/lib/finance/queries'
import type { Resource } from '@/lib/finance/contracts'
import type { Budget, BudgetWarning, Category, List, PotList } from '@/lib/finance/types'
import { cn } from '@/lib/utils'

export type Label = keyof Messages
export const panel='grid gap-250 rounded-xl bg-white px-250 py-300 md:p-400 min-w-0'
export const financeDialog='w-[320px] px-250 py-300 md:w-full grid gap-250'
export function PageHeader({title,children}:{title:Label;children?:ReactNode}) { const {t}=useI18n();return <header className="flex flex-wrap items-center justify-between gap-200"><h1 tabIndex={-1} className="text-preset-1 text-grey-900">{t(title)}</h1>{children}</header> }
export function QueryMessage({query}:{query:{isPending:boolean;isError:boolean;isRefetching?:boolean;refetch:() => unknown}}) {
  const {t}=useI18n()
  const session = useAccountSession()
  if(query.isPending) return <p role="status">{t('Loading…')}</p>
  if(query.isError) return <div role="alert" className="grid gap-150 text-red"><p>{t('Could not load data. Please retry.')}</p><Button type="button" variant="secondary" disabled={session?.phase !== 'active'} onClick={()=>void query.refetch()}>{t('Reload data')}</Button></div>
  return query.isRefetching ? <p role="status">{t('Loading…')}</p> : null
}
export function Empty({label}:{label:Label}) { return <p className="text-preset-4 text-grey-500">{useI18n().t(label)}</p> }
export function FormInput({label,error,money=false,...props}:ComponentProps<typeof Input> & {label:Label;error?:string;money?:boolean}) {
  const id=useId(),{t}=useI18n()
  const input=<Input {...props} id={id} className={cn(money && 'pl-[5rem]',props.className)} aria-invalid={!!error || undefined} aria-describedby={error ? id+'-error' : undefined}/>
  return <div className="grid gap-50"><label htmlFor={id} className="text-preset-5-bold text-grey-500">{t(label)}</label>{money ? <div className="relative"><span aria-hidden="true" className="absolute left-250 top-[10px] text-preset-4 text-beige-500">$</span>{input}</div> : input}{error && <p id={id+'-error'} className="text-red text-preset-5">{error}</p>}</div>
}
export function FormSelect({label,value,onChange,options,error}:{label:Label;value:string;onChange:(value:string)=>void;options:{value:string;label:string}[];error?:string}) {
  const id=useId(),{t}=useI18n()
  return <div className="grid gap-50 min-w-0"><label htmlFor={id} className="text-preset-5-bold text-grey-500">{t(label)}</label><Select value={value} onValueChange={onChange}><SelectTrigger id={id} className="min-w-0 [&>span]:truncate" aria-invalid={!!error || undefined} aria-describedby={error ? id+'-error' : undefined}><SelectValue placeholder={t(label)}/></SelectTrigger><SelectContent className="max-w-[calc(100vw_-_32px)]">{options.map(option=><SelectItem key={option.value} value={option.value} className="whitespace-normal break-words [overflow-wrap:anywhere]">{option.label}</SelectItem>)}</SelectContent></Select>{error && <p id={id+'-error'} className="text-red text-preset-5">{error}</p>}</div>
}
export function errorLabel(error:unknown,category=false):Label {
  if(error instanceof ApiError) {
    if(error.status === 400) return 'Please review the marked fields.'
    if(error.status === 403) return 'Your security token expired. Please retry.'
    if(error.status === 404) return 'This record is no longer available. Reload the list.'
    if(error.status === 409) return category ? 'This category is used by a budget or recurring payment.' : 'This change conflicts with the saved data. Reload and review it.'
  }
  return 'The result is uncertain. Reload data before trying again.'
}
type DialogSave = {
  begin: () => boolean
  fail: () => void
  complete: () => void
}
const DialogSaveContext = createContext<DialogSave | null>(null)

type Draft = Record<string, string>
type SaveOptions<Result> = {
  resource: Resource | 'settings'
  id?: string
  label: Label
  name?: string
  draft?: Draft
  editor?: ReactNode
  optimistic?: { name?: string; color?: string }
  linked?: 'POT' | 'RECURRING_PAYMENT' | 'MANUAL'
  onConfirmed?: (result: Result, receivedAt: number) => void
}
type Operation = Omit<SaveOptions<unknown>, 'onConfirmed'> & {
  sequence: number
  state: 'pending' | 'rejected' | 'uncertain' | 'refreshing' | 'refresh'
  error?: unknown
}

const DraftContext = createContext<Operation | null>(null)
type Operations = {
  operations: Operation[]
  submit: <Result>(options: SaveOptions<Result>, execute: (signal?: AbortSignal) => Promise<Result>, replace?: number) => boolean
}
const OperationsContext = createContext<Operations | null>(null)

export function useDraftField(field: string, initial: string | (() => string)) {
  const recovered = useContext(DraftContext)
  return useState(() => recovered?.draft?.[field] ?? (typeof initial === 'function' ? initial() : initial))
}

export function useSaveOperation() {
  const operations = useContext(OperationsContext)
  if (!operations) throw new Error('SaveOperations is required')
  return operations.submit
}

export function usePendingEdit(resource: Resource, id: string) {
  return useContext(OperationsContext)?.operations.find(operation =>
    operation.state === 'pending' && operation.resource === resource && operation.id === id)?.optimistic
}

function affectedQueries(operation: Operation) {
  switch (operation.resource) {
    case 'settings': return ['summary']
    case 'categories': return ['categories', 'transactions', 'budgets', 'recurring', 'budget-expenses']
    case 'budgets': return ['budgets', 'budget-expenses']
    case 'savings-pots': return ['pots', 'transactions', 'summary', 'budgets', 'budget-expenses']
    case 'recurring-payments': return ['recurring', 'payment-summary', 'transactions', 'summary', 'budgets', 'budget-expenses']
    case 'transactions': return ['transactions', 'summary', 'budgets', 'budget-expenses',
      ...(operation.linked === 'POT' || !operation.linked ? ['pots'] : []),
      ...(operation.linked === 'RECURRING_PAYMENT' || !operation.linked ? ['recurring', 'payment-summary'] : [])]
  }
}

export function SaveOperations({ children }: { children: ReactNode }) {
  const { account, canAct, whenVerified, operationSignal, notify, phase, queries, concealed } = useFinance()
  const client = useQueryClient()
  const { t } = useI18n()
  const records = useRef<Operation[]>([])
  const next = useRef(0)
  const [operations, setOperations] = useState<Operation[]>([])
  const [verified, setVerified] = useState<number[]>([])
  const [editing, setEditing] = useState<Operation | null>(null)
  const reviewButton = useRef<HTMLButtonElement | null>(null)
  const reviewOpen = useRef(false)
  const mutation = useMutation({ mutationFn: (execute: () => Promise<unknown>) => execute(), retry: false, networkMode: 'always' })

  function update(change: (current: Operation[]) => Operation[]) {
    records.current = change(records.current)
    setOperations(records.current)
  }

  function setResult(operation: Operation, state?: Operation['state'], error?: unknown) {
    update(list => list.flatMap(item => item.sequence !== operation.sequence ? [item] : state ? [{ ...item, state, error }] : []))
  }

  function filter(operation: Operation) {
    const keys = affectedQueries(operation)
    return {
      queryKey: financeKey(account),
      predicate: ({ queryKey }: { queryKey: readonly unknown[] }) =>
        keys.some(key => key === queryKey[2]) && (operation.resource !== 'settings' || queryKey[3] === 'current'),
    }
  }

  function refresh(operation: Operation, verify = false) {
    return client.invalidateQueries({ ...filter(operation), refetchType: verify ? 'all' : 'active' }, { throwOnError: true })
  }

  async function verify(operation: Operation) {
    const signal = operationSignal()
    try {
      await refresh(operation, true)
      if (signal?.aborted || !canAct()) return
      if (operation.resource === 'savings-pots') {
        const movements = queries.transactions(recentTransactionFilters)
        if (!client.getQueryData(movements.queryKey)) await client.fetchQuery(movements)
      }
      if (signal?.aborted || !canAct()) return
      if (operation.state === 'refresh') setResult(operation)
      else setVerified(values => [...values, operation.sequence])
    } catch {
      // The record stays available for another verification attempt.
    }
  }

  function submit<Result>(options: SaveOptions<Result>, execute: (signal?: AbortSignal) => Promise<Result>, replace?: number) {
    if (!canAct()) return false
    if (options.id && records.current.some(item => item.resource === options.resource && item.id === options.id &&
      (item.state === 'pending' || item.state === 'uncertain'))) return false
    const signal = operationSignal()
    const operation: Operation = { ...options, sequence: ++next.current, state: 'pending' }
    update(list => [...list.filter(item => item.sequence !== replace), operation])

    async function run() {
      let result: Result
      try {
        result = await execute(signal)
      } catch (error) {
        if (signal?.aborted || !await whenVerified() || !canAct()) return
        const rejected = error instanceof ApiError && [400, 403, 404, 409].includes(error.status)
        setResult(operation, rejected ? 'rejected' : 'uncertain', error)
        return
      }
      const receivedAt = Date.now()
      if (signal?.aborted || !await whenVerified() || !canAct()) return
      await client.cancelQueries(filter(operation))
      if (signal?.aborted || !await whenVerified() || !canAct()) return
      if (operation.optimistic && result && typeof result === 'object') {
        if (operation.resource === 'categories' && 'name' in result && typeof result.name === 'string') {
          const name = result.name
          client.setQueryData<List<Category>>([...financeKey(account), 'categories'], data =>
            data && { ...data, items: data.items.map(item => item.id === operation.id ? { ...item, name } : item) })
        } else if (operation.resource === 'budgets' && 'color' in result && typeof result.color === 'string') {
          const color = result.color
          client.setQueriesData<List<Budget>>({ queryKey: [...financeKey(account), 'budgets'] }, data =>
            data && { ...data, items: data.items.map(item => item.id === operation.id ? { ...item, color: color } : item) })
        } else if (operation.resource === 'savings-pots' && 'name' in result && typeof result.name === 'string' &&
          'color' in result && typeof result.color === 'string') {
          const { name, color } = result
          client.setQueriesData<PotList>({ queryKey: [...financeKey(account), 'pots'] }, data => data && {
            ...data, items: data.items.map(item => item.id === operation.id ? { ...item, name, color } : item),
          })
        }
      }
      setResult(operation, 'refreshing')
      options.onConfirmed?.(result, receivedAt)
      const warnings = result && typeof result === 'object' && 'budgetWarnings' in result
        ? result.budgetWarnings as BudgetWarning[] : []
      notify({ warnings })
      try {
        await refresh(operation)
        if (!signal?.aborted) setResult(operation)
      } catch {
        if (!signal?.aborted) setResult(operation, 'refresh')
      }
    }
    mutation.mutate(run)
    return true
  }

  return <OperationsContext.Provider value={{ operations, submit }}>
    {children}
    {operations.some(operation => operation.state !== 'refreshing') && <section aria-label={t('Pending changes')} className="sticky bottom-0 z-10 grid max-h-[40dvh] gap-100 overflow-auto rounded-lg bg-white p-150">
      {operations.filter(operation => operation.state !== 'refreshing').map(operation => <div className="flex flex-wrap items-center gap-100" key={operation.sequence}>
        <p role={operation.state === 'pending' ? 'status' : 'alert'}>
          {t(operation.label)}{operation.name ? ' · ' + operation.name : ''} · {t(operation.state === 'pending' ? 'Pending confirmation' :
            operation.state === 'refresh' ? 'Could not load data. Please retry.' :
            operation.label === 'Undo' && operation.error instanceof ApiError && operation.error.status === 409 ? 'The undo window has expired.' : errorLabel(operation.error, operation.resource === 'categories' && operation.label === 'Delete'))}
        </p>
        {(operation.state === 'uncertain' || operation.state === 'refresh') &&
          <Button type="button" variant="secondary" disabled={phase !== 'active'} onClick={() => void verify(operation)}>{t('Verify')}</Button>}
        {operation.state === 'uncertain' && verified.includes(operation.sequence) &&
          <Button type="button" variant="secondary" onClick={() => setResult(operation)}>{t('Dismiss review')}</Button>}
        {operation.state === 'rejected' && operation.editor &&
          <Button type="button" variant="secondary" disabled={phase !== 'active'} onClick={event => {
            reviewButton.current = event.currentTarget
            reviewOpen.current = true
            setEditing(operation)
          }}>{t('Review draft')}</Button>}
      </div>)}
    </section>}
    {editing && <Dialog open={phase === 'active'} onOpenChange={open => {
      if (!open) { reviewOpen.current = false; setEditing(null) }
    }}>
      <DialogContent style={concealed ? { visibility: 'hidden' } : undefined} className="max-w-[calc(100%-32px)] max-h-[90dvh] overflow-y-auto" onCloseAutoFocus={event => {
        event.preventDefault()
        const target = reviewButton.current?.isConnected ? reviewButton.current : document.querySelector<HTMLElement>('main h1')
        target?.focus({ preventScroll: true })
      }}>
        <DialogHeader><DialogTitle>{t(editing.label)}</DialogTitle><DialogDescription>{t('Review draft')}</DialogDescription></DialogHeader>
        <DraftContext.Provider value={editing}>
          <DialogSaveContext.Provider value={{ begin: () => reviewOpen.current, fail: () => {}, complete: () => {
            reviewOpen.current = false
            setEditing(null)
          } }}>{editing.editor}</DialogSaveContext.Provider>
        </DraftContext.Provider>
      </DialogContent>
    </Dialog>}
  </OperationsContext.Provider>
}

export function useSave<Result>(prepare: () => (signal?: AbortSignal) => Promise<Result>, options: SaveOptions<Result>) {
  const { refresh, canAct, phase } = useFinance()
  const operations = useContext(OperationsContext)
  const dialog = useContext(DialogSaveContext)
  const recovered = useContext(DraftContext)
  const [error, setError] = useState<unknown>(recovered?.error ?? null)
  const [duplicate, setDuplicate] = useState(false)
  const submitted = useRef(false)
  function submit() {
    if (!canAct() || submitted.current) return
    let work: ReturnType<typeof prepare>
    try {
      work = prepare()
    } catch (cause) {
      setError(cause)
      return
    }
    if (dialog && !dialog.begin()) return
    if (!operations?.submit(options, work, recovered?.sequence)) {
      setDuplicate(true)
      dialog?.fail()
      return
    }
    submitted.current = Boolean(dialog)
    setError(null)
    dialog?.complete()
  }
  return { submit, error, duplicate, blocked: phase !== 'active', refresh }
}

export function SaveForm({save,children,category=false,submitLabel='Save',className,destructive=false}:{save:ReturnType<typeof useSave>;children:ReactNode;category?:boolean;submitLabel?:Label;className?:string;destructive?:boolean}) {
  const {t}=useI18n()
  const form = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (save.error instanceof ApiError && save.error.status === 400) form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [save.error])
  return <form ref={form} noValidate className={cn('grid gap-200',className)} onSubmit={event=>{event.preventDefault();save.submit()}}>
    <fieldset disabled={save.blocked} className="grid gap-[inherit] min-w-0">{children}</fieldset>
    {save.duplicate && <p role="alert">{t('Another change for this record is pending.')}</p>}
    {Boolean(save.error) && <div role="alert" className="grid gap-100 text-red"><p>{t(errorLabel(save.error,category))}</p>{!(save.error instanceof ApiError && save.error.status === 400) && <Button type="button" disabled={save.blocked} variant="secondary" onClick={()=>void save.refresh()}>{t('Reload data')}</Button>}</div>}
    <Button type="submit" disabled={save.blocked} variant={destructive ? 'destroy' : undefined} className="text-white">{t(submitLabel)}</Button>
    <SessionRetry />
  </form>
}

function useEditorDialog() {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const busy = useRef(false)
  const completed = useRef(false)

  function release() {
    busy.current = false
    setSaving(false)
  }

  const save: DialogSave = {
    begin() {
      if (busy.current || !open) return false
      busy.current = true
      setSaving(true)
      return true
    },
    fail: release,
    complete() {
      completed.current = true
      setOpen(false)
    },
  }
  return {
    open, save,
    setOpen(next: boolean) { if (!busy.current) setOpen(next) },
    content: {
      closeDisabled: saving,
      onEscapeKeyDown(event: KeyboardEvent) { if (busy.current) event.preventDefault() },
      onInteractOutside(event: Event) { if (busy.current) event.preventDefault() },
    },
    finishClose(event: Event, opener: HTMLButtonElement | null, deleted = false) {
      event.preventDefault()
      const focusTarget = (!deleted || !completed.current) && opener?.isConnected
        ? opener
        : document.querySelector<HTMLElement>('main h1')
      focusTarget?.focus({ preventScroll: true })
      completed.current = false
      release()
    },
  }
}

const contentWidth = 'max-w-[calc(100%_-_32px)] md:max-w-lg max-h-[90dvh] overflow-y-auto'

export function NewDialog({title,children,buttonLabel,prefix=true,variant,heading,description,contentClassName}:{title:Label;children:ReactNode;buttonLabel?:Label;prefix?:boolean;variant?:ComponentProps<typeof Button>['variant'];heading?:ReactNode;description?:Label;contentClassName?:string}) {
  const dialog = useEditorDialog()
  const concealed = useAccountSession()?.concealed
  const trigger = useRef<HTMLButtonElement>(null)
  const { t } = useI18n()
  return <Dialog open={dialog.open} onOpenChange={dialog.setOpen}>
    <DialogTrigger asChild><Button ref={trigger} variant={variant} className={variant ? '' : 'text-white'}>{prefix ? '+ ' : ''}{t(buttonLabel ?? title)}</Button></DialogTrigger>
    <DialogContent style={concealed ? { visibility: 'hidden' } : undefined} className={cn(contentWidth, contentClassName)} {...dialog.content} onCloseAutoFocus={event => dialog.finishClose(event, trigger.current)}>
      <DialogHeader className={contentClassName ? 'grid justify-start gap-250' : undefined}>
        <DialogTitle className={cn(contentClassName && 'text-start',heading && 'text-start text-preset-2 text-grey-900')}>{heading ?? t(title)}</DialogTitle>
        <DialogDescription className={description ? 'text-start text-preset-4 text-grey-500' : 'sr-only'}>{t(description ?? title)}</DialogDescription>
      </DialogHeader>
      <DialogSaveContext.Provider value={dialog.save}>{children}</DialogSaveContext.Provider>
    </DialogContent>
  </Dialog>
}

export function RowActions({name,recordId,edit,remove,extra,contentClassName}:{name:string;recordId:string;edit:ReactNode;remove:ReactNode;extra?:{label:Label;content:ReactNode};contentClassName?:string}) {
  const [action, setAction] = useState<'edit' | 'delete' | 'extra'>('edit')
  const dialog = useEditorDialog()
  const concealed = useAccountSession()?.concealed
  const trigger = useRef<HTMLButtonElement>(null)
  const { t } = useI18n()
  function select(next: typeof action) {
    setAction(next)
    dialog.setOpen(true)
  }
  return <>
    <DropdownMenu><DropdownMenuTrigger ref={trigger} aria-label={`${t('Actions')}: ${name} (#${recordId})`} className="flex min-h-[44px] min-w-[44px] items-center justify-center"><DotsThreeOutline size={20} weight="fill"/></DropdownMenuTrigger><DropdownMenuContent className="rounded-lg bg-white px-250 py-150" onCloseAutoFocus={event => { if (dialog.open) event.preventDefault() }}>
      <DropdownMenuItem onSelect={() => select('edit')}>{t('Edit')}</DropdownMenuItem><DropdownMenuSeparator/>
      {extra && <><DropdownMenuItem onSelect={() => select('extra')}>{t(extra.label)}</DropdownMenuItem><DropdownMenuSeparator/></>}
      <DropdownMenuItem className="text-red" onSelect={() => select('delete')}>{t('Delete')}</DropdownMenuItem>
    </DropdownMenuContent></DropdownMenu>
    <Dialog open={dialog.open} onOpenChange={dialog.setOpen}>
      <DialogContent style={concealed ? { visibility: 'hidden' } : undefined} className={cn(contentWidth, contentClassName)} {...dialog.content} onCloseAutoFocus={event => dialog.finishClose(event, trigger.current, action === 'delete')}>
        <DialogHeader className={contentClassName ? 'grid justify-start gap-250' : undefined}>
          <DialogTitle className={cn('break-words',contentClassName && 'text-start',contentClassName && action === 'delete' && 'text-preset-2')}>{t(action === 'edit' ? 'Edit' : action === 'delete' ? 'Delete' : extra?.label ?? 'Actions')}: {name}</DialogTitle>
          <DialogDescription className="sr-only">{name}</DialogDescription>
        </DialogHeader>
        <DialogSaveContext.Provider value={dialog.save}>{action === 'edit' ? edit : action === 'delete' ? remove : extra?.content}</DialogSaveContext.Provider>
      </DialogContent>
    </Dialog>
  </>
}

export function ConfirmForm({description,save,category=false}:{description:Label;save:ReturnType<typeof useSave>;category?:boolean}) {
  const {t}=useI18n()
  return <><SaveForm save={save} category={category} destructive={!category} submitLabel="Yes, Confirm Deletion"><p className="text-preset-4 text-grey-500">{t('Confirm deletion?')}</p><p className="text-preset-4 text-grey-500">{t(description)}</p></SaveForm>{!category && <DialogClose className="text-preset-4 text-grey-500">{t('No, I want to go back')}</DialogClose>}</>
}
