'use client'

import { useState, useTransition } from 'react'
import { deleteUser } from './actions'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

export default function DeleteUserButton({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteUser(userId)
        setIsOpen(false)
      } catch (error) {
        console.error('Failed to delete user:', error)
        alert('Failed to delete user')
      }
    })
  }

  return (
    <>
      <button 
        type="button" 
        onClick={() => setIsOpen(true)}
        disabled={isPending}
        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors ml-2 disabled:opacity-50"
      >
        {isPending ? '...' : 'Delete'}
      </button>

      <ConfirmDialog
        isOpen={isOpen}
        title="Delete User"
        message="Are you sure you want to permanently delete this user?"
        confirmText={isPending ? 'Deleting...' : 'Delete'}
        onConfirm={handleDelete}
        onCancel={() => !isPending && setIsOpen(false)}
      />
    </>
  )
}
