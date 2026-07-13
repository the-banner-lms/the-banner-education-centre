'use client';

import React, { useState, useTransition } from 'react';
import { createReply, deleteReply } from '@/app/actions/announcementActions';
import RichTextEditor from '@/components/RichTextEditor';

interface Reply {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    first_name: string;
    last_name: string;
    role: string;
  };
}

interface AnnouncementRepliesProps {
  announcementId: string;
  replies: Reply[];
  currentUserId: string;
  currentUserRole: string;
}

export default function AnnouncementReplies({ announcementId, replies, currentUserId, currentUserRole }: AnnouncementRepliesProps) {
  const [newReplyContent, setNewReplyContent] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newReplyContent || newReplyContent === '<p><br></p>') {
      setError('Reply cannot be empty.');
      return;
    }

    startTransition(async () => {
      const result = await createReply(announcementId, newReplyContent);
      if (result.error) {
        setError(result.error);
      } else {
        setNewReplyContent('');
      }
    });
  };

  const handleDelete = (replyId: string) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;
    
    startTransition(async () => {
      await deleteReply(replyId, announcementId);
    });
  };

  return (
    <div className="mt-12">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Replies ({replies?.length || 0})</h3>
      
      {/* Existing Replies */}
      <div className="space-y-6 mb-8">
        {replies?.map((reply) => (
          <div key={reply.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold uppercase">
                {reply.profiles?.first_name?.[0] || 'U'}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="font-semibold text-gray-900">
                    {reply.profiles?.first_name} {reply.profiles?.last_name}
                  </span>
                  <span className="ml-2 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full capitalize">
                    {reply.profiles?.role}
                  </span>
                  <span className="ml-3 text-xs text-gray-500">
                    {new Date(reply.created_at).toLocaleString()}
                  </span>
                </div>
                {(currentUserRole === 'admin' || currentUserId === reply.user_id) && (
                  <button 
                    onClick={() => handleDelete(reply.id)}
                    disabled={isPending}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: reply.content }} />
            </div>
          </div>
        ))}
        {(!replies || replies.length === 0) && (
          <p className="text-gray-500 text-sm italic">No replies yet. Be the first to comment!</p>
        )}
      </div>

      {/* Leave a Reply Form */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Leave a Reply</h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <RichTextEditor
            label="Your Reply"
            value={newReplyContent}
            onChange={setNewReplyContent}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
            >
              {isPending ? 'Posting...' : 'Post Reply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
