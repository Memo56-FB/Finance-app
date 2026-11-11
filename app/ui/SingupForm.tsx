'use client'

import { Text } from '@/lib/i18n/client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { InputPassword } from '@/components/ui/InputPassword'

export const SingupForm = () => {
  return (
    <form method="post" onSubmit={(event) => event.preventDefault()} className='bg-white px-250 md:px-400 py-300 gap-400 rounded-xl grid w-full md:max-w-[560px]'>
      <h1 className='text-preset-1 font-sa'><Text id="Sign Up" /></h1>
      <div className='grid gap-200'>
        <div className='grid gap-50'>
          <label htmlFor="name" className='text-preset-5-bold text-grey-500'><Text id="Name" /></label>
          <Input
            id="name"
            type="text"
            name="name"
          />
        </div>
        <div className='grid gap-50'>
          <label htmlFor="email" className='text-preset-5-bold text-grey-500'><Text id="Email" /></label>
          <Input
            id="email"
            type="email"
            name="email"
          />
        </div>
        <div className='grid gap-50'>
          <label htmlFor="password" className='text-preset-5-bold text-grey-500'><Text id="Create Password" /></label>
          <InputPassword
            id="password"
            name="password"
          />
          <span className='text-preset-5 justify-self-end text-grey-500'><Text id="Passwords must be at least 8 characters" /></span>
        </div>

      </div>
      <p className='text-preset-5 text-grey-500'><Text id="Account creation is unavailable in this demo." /></p>
      <Button type="submit" disabled><Text id="Create Account" /></Button>
      <div className='flex gap-100'>
        <p className='text-preset-4 text-grey-500'><Text id="Already have an account?" /></p>
        <Link href="/login" className='text-grey-900 text-preset-4-bold underline'><Text id="Login" /></Link>
      </div>
    </form>
  )
}
