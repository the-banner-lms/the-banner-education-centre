'use client'

import { useState, useTransition } from 'react'
import { deleteTeamMember } from '@/app/actions/teamActions'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

export default function DeleteTeamButton({ id }: { id: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteTeamMember(id)
        setIsOpen(false)
      } catch (error) {
        console.error('Failed to delete:', error)
        alert('Failed to delete team member')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={isPending}
        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
      >
        {isPending ? 'Deleting...' : 'Delete'}
      </button>

      <ConfirmDialog
        isOpen={isOpen}
        title="Delete Team Member"
        message="Are you sure you want to delete this team member?"
        confirmText={isPending ? 'Deleting...' : 'Delete'}
        onConfirm={handleDelete}
        onCancel={() => !isPending && setIsOpen(false)}
      />
    </>
  )
}
