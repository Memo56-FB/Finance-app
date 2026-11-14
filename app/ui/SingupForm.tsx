'use client'
import { AccountForm } from './AccountForm'
export function SingupForm(props: { next?: string; unavailable?: boolean }) { return <AccountForm register {...props} /> }
