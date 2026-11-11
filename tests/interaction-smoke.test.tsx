// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { InputPassword } from '@/components/ui/InputPassword'
import { AddMoneyPot } from '@/app/ui/pots/AddMoneyPot'
import { WithDrawalMoneyPot } from '@/app/ui/pots/WithDrawalMoneyPot'
import { LoginForm } from '@/app/ui/LoginForm'
import { SingupForm } from '@/app/ui/SingupForm'

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

  it.each([
    { name: 'addition', Component: AddMoneyPot, trigger: '+Add Money', label: 'Amount to Add', total: '$110.50', percentage: '55.25%', confirm: 'Confirm Addition' },
    { name: 'withdrawal', Component: WithDrawalMoneyPot, trigger: 'Withdraw', label: 'Amount to Withdraw', total: '$89.50', percentage: '44.75%', confirm: 'Confirm Withdrawal' },
  ])('accepts cents in the $name preview without offering an unsaved confirmation', async ({ Component, trigger, label, total, percentage, confirm }) => {
    const user = userEvent.setup()
    render(<Component title="Holiday" totalSaved={100} targetOf={200} color="green" />)

    await user.click(screen.getByRole('button', { name: trigger }))
    const amount = screen.getByLabelText(label)
    expect(screen.getByText('$100.00')).toBeInTheDocument()

    await user.clear(amount)
    await user.type(amount, '10.50')

    expect(amount).toBeValid()
    expect(screen.getByText(total)).toBeInTheDocument()
    expect(screen.getByText(percentage)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: confirm })).toBeDisabled()
  })

  it.each([
    { name: 'login', Component: LoginForm, button: 'Login' },
    { name: 'signup', Component: SingupForm, button: 'Create Account' },
  ])('blocks the demo $name form from sending credentials', ({ Component, button }) => {
    const { container } = render(<Component />)
    const form = container.querySelector('form')!

    expect(form).toHaveAttribute('method', 'post')
    expect(fireEvent.submit(form)).toBe(false)
    expect(screen.getByRole('button', { name: button })).toBeDisabled()
  })
})
