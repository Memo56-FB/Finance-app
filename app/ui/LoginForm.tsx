import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputPassword } from '@/components/ui/InputPassword'
import Link from 'next/link'
import React from 'react'

export const LoginForm = () => {
  return (
    <form action="" className='bg-white px-250 md:px-400 py-300 gap-400 rounded-xl grid w-full md:max-w-[560px]'>
      <h1 className='text-preset-1 font-sa'>Login</h1>
      <div className='grid gap-200'>
        <div className='grid gap-50'>
          <label htmlFor="email" className='text-preset-5-bold text-grey-500'>
            Email
          </label>
          <Input
            id="email"
            type="email"
            name="email"
          />
        </div>
        <div className='grid gap-50'>
          <label htmlFor="password" className='text-preset-5-bold text-grey-500'>
            Password
          </label>
          <InputPassword
            id="password"
            name="password"
          />
        </div>

      </div>
      <Button>
        Login
      </Button>
      <div className='flex gap-100'>
        <p className='text-preset-4 text-grey-500'>Need to create an account?</p>
        <Link href="/singup" className='text-grey-900 text-preset-4-bold underline'>
          Sign Up
        </Link>
      </div>
    </form>
  )
}
