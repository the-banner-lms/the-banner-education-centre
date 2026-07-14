'use client'

import { useTransition } from 'react'
import { deleteComment } from './actions'

export default function DeleteCommentButton({ commentId }: { commentId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this comment?')) {
      startTransition(async () => {
        try {
          await deleteComment(commentId)
        } catch (error) {
          console.error('Failed to delete comment:', error)
          alert('Failed to delete comment')
        }
      })
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm transition-colors disabled:opacity-50"
    >
      {isPending ? 'Deleting...' : 'Delete'}
    </button>
  )
}
