'use client'
import React from 'react'

export const Progress = ({ max, value, color }: {
  max: number
  value: number
  color: string
}) => {
  return (
    <>
      <progress
        className={`
          h-400 w-full progress [&::-webkit-progress-bar]:bg-beige-100 [&::-webkit-progress-value]:bg-${color}
          [&::-webkit-progress-bar]:rounded [&::-webkit-progress-bar]:p-50
          [&::-webkit-progress-value]:rounded
        `}
        max={max}
        value={value}>
          {value}%
      </progress>
    </>
  )
}
