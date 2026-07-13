'use client';

import { useState, useTransition } from 'react';
import { createReply, deleteReply } from '@/app/actions/announcementActions';

interface Reply {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

interface ReplySectionProps {
  announcementId: string;
  initialReplies: Reply[];
  currentUserId: string;
  currentUserRole: string;
}

export default function ReplySection({ announcementId, initialReplies, currentUserId, currentUserRole }: ReplySectionProps) {
  
  const [newReply, setNewReply] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleCreateReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReply.trim()) return;

    startTransition(async () => {
      const result = await createReply(announcementId, newReply);
      if (result.success) {
        setNewReply('');
        // A server revalidation will occur, but optimistic UI or full refresh is fine.
        // Actually since we rely on router refresh via revalidatePath, we don't strictly need optimistic update if it's quick.
      }
    });
  };

  const handleDeleteReply = (replyId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    startTransition(async () => {
      const result = await deleteReply(replyId, announcementId);
      if (result.success) {
        // Handled by revalidatePath
      }
    });
  };

  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Comments ({initialReplies.length})</h3>

      <div className="space-y-6 mb-8">
        {initialReplies.map((reply) => {
          const canDelete = currentUserRole === 'admin' || reply.user_id === currentUserId;
          return (
            <div key={reply.id} className="bg-gray-50 rounded-lg p-4 relative group">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    {reply.profiles?.first_name} {reply.profiles?.last_name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(reply.created_at).toLocaleString()}
                  </p>
                </div>
                {canDelete && (
                  <button
                    onClick={() => handleDeleteReply(reply.id)}
                    disabled={isPending}
                    className="text-red-500 hover:text-red-700 text-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="mt-3 text-sm text-gray-800 whitespace-pre-wrap">
                {reply.content}
              </div>
            </div>
          );
        })}
        {initialReplies.length === 0 && (
          <p className="text-gray-500 text-sm text-center italic">No comments yet. Be the first to share your thoughts!</p>
        )}
      </div>

      <form onSubmit={handleCreateReply} className="mt-4">
        <label htmlFor="newReply" className="block text-sm font-medium text-gray-700 mb-2">
          Leave a comment
        </label>
        <textarea
          id="newReply"
          rows={3}
          value={newReply}
          onChange={(e) => setNewReply(e.target.value)}
          placeholder="Write your comment here..."
          className="w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 text-sm"
          disabled={isPending}
        />
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={isPending || !newReply.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isPending ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>
    </div>
  );
}
