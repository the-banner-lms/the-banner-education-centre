'use client'

import { useState } from 'react'
import { updateOwnEmail } from '@/app/dashboard/actions'

export default function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setMessage(null)
    const result = await updateOwnEmail(formData)
    setIsPending(false)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else if (result.success) {
      setMessage({ type: 'success', text: result.success })
      setIsEditing(false)
    }
  }

  if (!isEditing) {
    return (
      <div className="mt-3">
        <button 
          onClick={() => setIsEditing(true)}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Change Email Address
        </button>
        {message && message.type === 'success' && (
          <p className="mt-2 text-sm text-green-600 font-medium">{message.text}</p>
        )}
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">Update Email Address</h3>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          name="email"
          defaultValue={currentEmail}
          required
          className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
          placeholder="New email address"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditing(false)
              setMessage(null)
            }}
            disabled={isPending}
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </div>
      {message && message.type === 'error' && (
        <p className="mt-2 text-sm text-red-600">{message.text}</p>
      )}
    </form>
  )
}
