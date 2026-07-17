'use client'

import { useState, type InputHTMLAttributes } from 'react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export default function PasswordInput({ className = '', ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative w-full">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`${className} pr-12`}
      />
      <button
        type="button"
        onClick={() => setVisible(current => !current)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-1 flex min-h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-banner-dark/40"
      >
        {visible ? (
          <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
        ) : (
          <EyeIcon className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
