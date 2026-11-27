import clsx from 'clsx'
import Image from 'next/image'
import React from 'react'

type BrandLogoProps = {
  variant?: 'full' | 'mark'
  className?: string
}

export const BrandLogo = ({ variant = 'full', className }: BrandLogoProps) => {
  if (variant === 'mark') {
    return (
      <Image
        className={clsx('pixelated', className)}
        src='/brand/heart.svg'
        alt='finance'
        width={28}
        height={24}
      />
    )
  }

  return (
    <span
      role='img'
      aria-label='finance'
      className={clsx('inline-flex items-center gap-2 font-heading text-[18px] leading-none text-foreground px-text-shadow', className)}
    >
      <Image className='pixelated' src='/brand/heart.svg' alt='' width={21} height={18} aria-hidden='true' />
      <span aria-hidden='true'>finance</span>
    </span>
  )
}
