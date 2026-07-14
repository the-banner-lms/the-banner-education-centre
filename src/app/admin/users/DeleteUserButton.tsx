'use client'

import { useFormStatus } from 'react-dom'
import { deleteUser } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors ml-2 disabled:opacity-50"
    >
      {pending ? '...' : 'Delete'}
    </button>
  )
}

export default function DeleteUserButton({ userId }: { userId: string }) {
  return (
    <form 
      action={deleteUser.bind(null, userId)} 
      onSubmit={(e) => {
        if (!window.confirm('Are you sure you want to permanently delete this user?')) {
          e.preventDefault()
        }
      }}
    >
      <SubmitButton />
    </form>
  )
}
