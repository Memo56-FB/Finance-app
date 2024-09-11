import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { InputPassword } from '@/components/ui/InputPassword'

export const SingupForm = () => {
  return (
    <form action="" className='bg-white px-250 md:px-400 py-300 gap-400 rounded-xl grid w-full md:max-w-[560px]'>
      <h1 className='text-preset-1 font-sa'>Sign Up</h1>
      <div className='grid gap-200'>
        <div className='grid gap-50'>
          <label htmlFor="name" className='text-preset-5-bold text-grey-500'>
            Name
          </label>
          <Input
            id="name"
            type="text"
            name="name"
          />
        </div>
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
            Create Password
          </label>
          <InputPassword
            id="password"
            name="password"
          />
          <span className='text-preset-5 justify-self-end text-grey-500'>
            Passwords must be at least 8 characters
          </span>
        </div>

      </div>
      <Button>
        Create Account
      </Button>
      <div className='flex gap-100'>
        <p className='text-preset-4 text-grey-500'>Already have an account?</p>
        <Link href="/login" className='text-grey-900 text-preset-4-bold underline'>
          Login
        </Link>
      </div>
    </form>
  )
}
