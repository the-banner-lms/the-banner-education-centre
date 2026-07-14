'use client'

import { useTransition } from 'react'
import { deleteTeamMember } from '@/app/actions/teamActions'

export default function DeleteTeamButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this team member?')) {
      startTransition(async () => {
        try {
          await deleteTeamMember(id)
        } catch (error) {
          console.error('Failed to delete:', error)
          alert('Failed to delete team member')
        }
      })
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
    >
      {isPending ? 'Deleting...' : 'Delete'}
    </button>
  )
}
