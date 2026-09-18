// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { InputPassword } from '@/components/ui/InputPassword'
import { AddMoneyPot } from '@/app/ui/pots/AddMoneyPot'

describe('interactive UI smoke tests', () => {
  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    render(<InputPassword aria-label="Password" />)

    const password = screen.getByLabelText('Password')
    await user.type(password, 'secret-value')
    expect(password).toHaveAttribute('type', 'password')
    expect(password).toHaveValue('secret-value')

    await user.click(screen.getByRole('button', { name: 'Toggle password visibility' }))
    expect(password).toHaveAttribute('type', 'text')
    expect(password).toHaveValue('secret-value')

    await user.click(screen.getByRole('button', { name: 'Toggle password visibility' }))
    expect(password).toHaveAttribute('type', 'password')
    expect(password).toHaveValue('secret-value')
  })

  it('updates the savings preview when money is added', async () => {
    const user = userEvent.setup()
    render(<AddMoneyPot title="Holiday" totalSaved={100} targetOf={200} color="green" />)

    await user.click(screen.getByRole('button', { name: '+Add Money' }))
    const amount = screen.getByLabelText('Amount to Add')
    expect(screen.getByText('$100.00')).toBeInTheDocument()

    await user.clear(amount)
    await user.type(amount, '10')

    expect(screen.getByText('$110.00')).toBeInTheDocument()
    expect(screen.getByText('55.00%')).toBeInTheDocument()
  })
})
