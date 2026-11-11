'use client'

import { Text } from '@/lib/i18n/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputPassword } from '@/components/ui/InputPassword'
import Link from 'next/link'
import React from 'react'

export const LoginForm = () => {
  return (
    <form method="post" onSubmit={(event) => event.preventDefault()} className='bg-white px-250 md:px-400 py-300 gap-400 rounded-xl grid w-full md:max-w-[560px]'>
      <h1 className='text-preset-1 font-sa'><Text id="Login" /></h1>
      <div className='grid gap-200'>
        <div className='grid gap-50'>
          <label htmlFor="email" className='text-preset-5-bold text-grey-500'><Text id="Email" /></label>
          <Input
            id="email"
            type="email"
            name="email"
          />
        </div>
        <div className='grid gap-50'>
          <label htmlFor="password" className='text-preset-5-bold text-grey-500'><Text id="Password" /></label>
          <InputPassword
            id="password"
            name="password"
          />
        </div>

      </div>
      <p className='text-preset-5 text-grey-500'><Text id="Login is unavailable in this demo." /></p>
      <Button type="submit" disabled><Text id="Login" /></Button>
      <div className='flex gap-100'>
        <p className='text-preset-4 text-grey-500'><Text id="Need to create an account?" /></p>
        <Link href="/singup" className='text-grey-900 text-preset-4-bold underline'><Text id="Sign Up" /></Link>
      </div>
    </form>
  )
}
