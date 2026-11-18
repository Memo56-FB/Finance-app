// @vitest-environment jsdom
import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { PotMoneyForm } from '@/app/ui/finance/forms'
import { makeQueryClient } from '@/lib/api/QueryProvider'
import { ApiError } from '@/lib/api/client'
import { AccountScope } from '@/lib/finance/AccountScope'
import { PreferencesProvider } from '@/lib/i18n/client'
import { en } from '@/lib/i18n'
import type { Pot } from '@/lib/finance/types'
import * as services from '@/lib/finance/services'

const pot:Pot={id:'1',name:'Holiday',balance:'100.00',targetAmount:'200.00',color:'#123456'}
function preview(action:'deposits'|'withdrawals',record=pot) {
  const client=makeQueryClient()
  return {...render(<QueryClientProvider client={client}><PreferencesProvider preferences={{language:'en'}} messages={en}><AccountScope account="preview@example.test"><PotMoneyForm record={record} action={action} onDone={()=>{}}/></AccountScope></PreferencesProvider></QueryClientProvider>),client}
}

it.each([
  {action:'deposits' as const,label:'Amount to Add',amount:'$110.50',percentage:'55.25',color:'#123456'},
  {action:'withdrawals' as const,label:'Amount to Withdraw',amount:'$89.50',percentage:'44.75',color:'#C94736'},
])('restores the $action balance and two-color progress preview',async({action,label,amount,percentage,color})=>{
  const user=userEvent.setup()
  preview(action)
  await user.clear(screen.getByLabelText(label))
  await user.type(screen.getByLabelText(label),'10.50')
  expect(screen.getByText(amount)).toBeInTheDocument()
  expect(screen.getByText(percentage+'%')).toBeInTheDocument()
  const bar=screen.getByRole('progressbar')
  expect(bar).toHaveAttribute('aria-valuenow',percentage)
  expect(bar).toHaveAttribute('aria-valuetext',amount)
  expect(bar.lastElementChild).toHaveStyle({backgroundColor:color})
})

it('keeps the preview exact above Number precision and caps only the visual progress',async()=>{
  const user=userEvent.setup()
  preview('withdrawals',{...pot,balance:'99999999999999999.99',targetAmount:'1.00'})
  await user.clear(screen.getByLabelText('Amount to Withdraw'))
  await user.type(screen.getByLabelText('Amount to Withdraw'),'0.01')
  expect(screen.getByText('$99,999,999,999,999,999.98')).toBeInTheDocument()
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow','100')
})

it('shows an excessive withdrawal without silently reducing the entered amount',async()=>{
  const move=vi.spyOn(services,'movePot').mockResolvedValue(pot)
  try {
    const user=userEvent.setup()
    preview('withdrawals')
    await user.clear(screen.getByLabelText('Amount to Withdraw'))
    await user.type(screen.getByLabelText('Amount to Withdraw'),'110')
    expect(screen.getByText('-$10.00')).toBeInTheDocument()
    await user.click(screen.getByRole('button',{name:'Confirm Withdrawal'}))
    await screen.findByRole('alert')
    expect(screen.getByLabelText('Amount to Withdraw')).toHaveValue('110')
    expect(screen.getByText('Insufficient funds.')).toBeInTheDocument()
    expect(screen.queryByRole('button',{name:'Reload data'})).not.toBeInTheDocument()
    expect(move).not.toHaveBeenCalled()
  } finally {move.mockRestore()}
})

it('keeps reload for an uncertain result without resending the withdrawal',async()=>{
  const move=vi.spyOn(services,'movePot').mockRejectedValue(new ApiError(0))
  try {
    const user=userEvent.setup()
    const {client}=preview('withdrawals')
    const refresh=vi.spyOn(client,'invalidateQueries')
    await user.clear(screen.getByLabelText('Amount to Withdraw'))
    await user.type(screen.getByLabelText('Amount to Withdraw'),'10')
    await user.click(screen.getByRole('button',{name:'Confirm Withdrawal'}))
    expect(await screen.findByRole('alert')).toHaveTextContent('The result is uncertain.')
    await user.click(screen.getByRole('button',{name:'Reload data'}))
    expect(refresh).toHaveBeenCalledOnce()
    expect(move).toHaveBeenCalledOnce()
    expect(screen.getByLabelText('Amount to Withdraw')).toHaveValue('10')
  } finally {move.mockRestore()}
})
