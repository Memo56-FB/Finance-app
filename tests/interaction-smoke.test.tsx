// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { InputPassword } from '@/components/ui/InputPassword'
import { AddMoneyPot } from '@/app/ui/pots/AddMoneyPot'
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
