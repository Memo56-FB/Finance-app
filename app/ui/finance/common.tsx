'use client'
import { createContext, useContext, useEffect, useId, useRef, useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DotsThreeOutline } from '@phosphor-icons/react/dist/ssr'
import { useI18n } from '@/lib/i18n/client'
import type { Messages } from '@/lib/i18n'
import { ApiError } from '@/lib/api/client'
import { SessionRetry, useFinance } from '@/lib/finance/AccountScope'
import type { BudgetWarning } from '@/lib/finance/types'
import { cn } from '@/lib/utils'

export type Label = keyof Messages
export const panel='grid gap-250 rounded-xl bg-white px-250 py-300 md:p-400 min-w-0'
export const financeDialog='w-[320px] px-250 py-300 md:w-full grid gap-250'
export function PageHeader({title,children}:{title:Label;children?:ReactNode}) { const {t}=useI18n();return <header className="flex flex-wrap items-center justify-between gap-200"><h1 tabIndex={-1} className="text-preset-1 text-grey-900">{t(title)}</h1>{children}</header> }
export function QueryMessage({query}:{query:{isPending:boolean;isError:boolean;refetch:() => unknown}}) {
  const {t}=useI18n()
  if(query.isPending) return <p role="status">{t('Loading…')}</p>
  if(query.isError) return <div role="alert" className="grid gap-150 text-red"><p>{t('Could not load data. Please retry.')}</p><Button type="button" variant="secondary" onClick={()=>void query.refetch()}>{t('Reload data')}</Button></div>
  return null
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
  complete: (afterClose: () => void) => void
}
const DialogSaveContext = createContext<DialogSave | null>(null)

export function useSave<Result>(save: () => Promise<Result>, options?: {
  onConfirmed?: (result: Result) => void
  refreshAfterSave?: () => Promise<unknown>
}) {
  const { refresh, notify, canAct, whenVerified, phase } = useFinance()
  const dialog = useContext(DialogSaveContext)
  const submitting = useRef(false)
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])
  const mutation = useMutation({ mutationFn: save, retry: false, networkMode: 'always' })

  async function submit() {
    if (!canAct() || submitting.current || (dialog && !dialog.begin())) return
    submitting.current = true
    try {
      const result = await mutation.mutateAsync()
      if (!mounted.current || !await whenVerified() || !mounted.current || !canAct()) return
      const warnings = result && typeof result === 'object' && 'budgetWarnings' in result
        ? result.budgetWarnings as BudgetWarning[]
        : []
      options?.onConfirmed?.(result)
      notify({ warnings })
      const refreshConfirmed = () => {
        if (canAct()) void (options?.refreshAfterSave ?? refresh)()
      }
      if (dialog) dialog.complete(refreshConfirmed)
      else refreshConfirmed()
    } catch {
      dialog?.fail()
    } finally {
      submitting.current = false
    }
  }

  return { submit, error: mutation.error, isPending: mutation.isPending, blocked: phase !== 'active', refresh }
}

export function SaveForm({save,children,category=false,submitLabel='Save',className,destructive=false}:{save:ReturnType<typeof useSave>;children:ReactNode;category?:boolean;submitLabel?:Label;className?:string;destructive?:boolean}) {
  const {t}=useI18n()
  return <form noValidate className={cn('grid gap-200',className)} onSubmit={event=>{event.preventDefault();void save.submit()}}>
    <fieldset disabled={save.isPending || save.blocked} className="grid gap-[inherit] min-w-0">{children}</fieldset>
    {save.error && <div role="alert" className="grid gap-100 text-red"><p>{t(errorLabel(save.error,category))}</p>{!(save.error instanceof ApiError && save.error.status === 400) && <Button type="button" disabled={save.blocked} variant="secondary" onClick={()=>void save.refresh()}>{t('Reload data')}</Button>}</div>}
    <Button type="submit" disabled={save.isPending || save.blocked} variant={destructive ? 'destroy' : undefined} className="text-white">{t(save.isPending ? 'Please wait…' : submitLabel)}</Button>
    <SessionRetry />
    <span role="status" className="sr-only">{save.isPending ? t('Please wait…') : ''}</span>
  </form>
}

function useEditorDialog() {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const busy = useRef(false)
  const afterClose = useRef<(() => void) | null>(null)

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
    complete(refresh) {
      afterClose.current = refresh
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
      const refresh = afterClose.current
      afterClose.current = null
      const focusTarget = (!deleted || !refresh) && opener?.isConnected
        ? opener
        : document.querySelector<HTMLElement>('main h1')
      focusTarget?.focus({ preventScroll: true })
      release()
      refresh?.()
    },
  }
}

const contentWidth = 'max-w-[calc(100%_-_32px)] md:max-w-lg max-h-[90dvh] overflow-y-auto'

export function NewDialog({title,children,buttonLabel,prefix=true,variant,heading,description,contentClassName}:{title:Label;children:ReactNode;buttonLabel?:Label;prefix?:boolean;variant?:ComponentProps<typeof Button>['variant'];heading?:ReactNode;description?:Label;contentClassName?:string}) {
  const dialog = useEditorDialog()
  const trigger = useRef<HTMLButtonElement>(null)
  const { t } = useI18n()
  return <Dialog open={dialog.open} onOpenChange={dialog.setOpen}>
    <DialogTrigger asChild><Button ref={trigger} variant={variant} className={variant ? '' : 'text-white'}>{prefix ? '+ ' : ''}{t(buttonLabel ?? title)}</Button></DialogTrigger>
    <DialogContent className={cn(contentWidth, contentClassName)} {...dialog.content} onCloseAutoFocus={event => dialog.finishClose(event, trigger.current)}>
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
      <DialogContent className={cn(contentWidth, contentClassName)} {...dialog.content} onCloseAutoFocus={event => dialog.finishClose(event, trigger.current, action === 'delete')}>
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
  return <><SaveForm save={save} category={category} destructive={!category} submitLabel="Yes, Confirm Deletion"><p className="text-preset-4 text-grey-500">{t('Confirm deletion?')}</p><p className="text-preset-4 text-grey-500">{t(description)}</p></SaveForm>{!category && <DialogClose disabled={save.isPending} className="text-preset-4 text-grey-500">{t('No, I want to go back')}</DialogClose>}</>
}
