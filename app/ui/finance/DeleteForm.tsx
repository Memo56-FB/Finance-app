'use client'

import type { Resource } from '@/lib/finance/contracts'
import { deleteRecord } from '@/lib/finance/services'
import type { PotDeletion } from '@/lib/finance/types'
import { ConfirmForm, useSave } from './common'

export function DeleteForm({ resource, id, onDeleted }: { resource: Resource; id: string; onDeleted?: (result: PotDeletion) => void }) {
  const save = useSave(() => deleteRecord(resource, id), {
    onConfirmed: result => { if (result) onDeleted?.(result) },
  })
  return <ConfirmForm save={save} category={resource === 'categories'} description={resource === 'savings-pots' ? 'Deleting this pot hides its linked transactions. You can undo for 10 seconds.' : resource === 'recurring-payments' ? 'Pending future payments will stop. Paid history will be preserved.' : resource === 'transactions' ? 'This correction can change a linked pot balance or payment status.' : 'Historical transactions will be preserved.'} />
}
