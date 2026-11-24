'use client'

import type { Resource } from '@/lib/finance/contracts'
import { deleteRecord } from '@/lib/finance/services'
import type { PotDeletion } from '@/lib/finance/types'
import { ConfirmForm, useSave } from './common'

export function DeleteForm({ resource, id, name, linked, onDeleted }: { resource: Resource; id: string; name?: string; linked?: 'POT' | 'RECURRING_PAYMENT' | 'MANUAL'; onDeleted?: (result: PotDeletion, receivedAt: number) => void }) {
  const save = useSave(() => signal => deleteRecord(resource, id, signal), {
    resource, id, label: 'Delete', name, linked,
    editor: <DeleteForm resource={resource} id={id} name={name} linked={linked} onDeleted={onDeleted} />,
    onConfirmed: (result, receivedAt) => { if (result) onDeleted?.(result, receivedAt) },
  })
  return <ConfirmForm save={save} category={resource === 'categories'} description={resource === 'savings-pots' ? 'Deleting this pot hides its linked transactions. You can undo for 10 seconds.' : resource === 'recurring-payments' ? 'Pending future payments will stop. Paid history will be preserved.' : resource === 'transactions' ? 'This correction can change a linked pot balance or payment status.' : 'Historical transactions will be preserved.'} />
}
