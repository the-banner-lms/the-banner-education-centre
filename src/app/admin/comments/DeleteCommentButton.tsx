'use client'

import { useState, useTransition } from 'react'
import { deleteComment } from './actions'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

export default function DeleteCommentButton({ commentId }: { commentId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteComment(commentId)
        setIsOpen(false)
      } catch (error) {
        console.error('Failed to delete comment:', error)
        alert('Failed to delete comment')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={isPending}
        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm transition-colors disabled:opacity-50"
      >
        {isPending ? 'Deleting...' : 'Delete'}
      </button>

      <ConfirmDialog
        isOpen={isOpen}
        title="Delete Comment"
        message="Are you sure you want to delete this comment?"
        confirmText={isPending ? 'Deleting...' : 'Delete'}
        onConfirm={handleDelete}
        onCancel={() => !isPending && setIsOpen(false)}
      />
    </>
  )
}
