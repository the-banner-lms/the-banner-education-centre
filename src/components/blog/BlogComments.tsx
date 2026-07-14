'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
  } | null;
}

export default function BlogComments({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const router = useRouter();

  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('blog_comments')
      .select(`
        id,
        content,
        created_at,
        user_id,
        profiles:user_id ( full_name )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
      
    if (!error && data) {
      setComments(data as unknown as Comment[]);
    }
  }, [postId, supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    fetchComments();
    
    // Auth state change listener for when they log in
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [postId, supabase, fetchComments]);

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/blog/${postId}`,
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    
    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('blog_comments')
      .insert([
        {
          post_id: postId,
          user_id: user.id,
          content: newComment.trim(),
        }
      ]);
      
    setIsSubmitting(false);
    
    if (!error) {
      setNewComment('');
      fetchComments();
    } else {
      alert('Error posting comment');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    const { error } = await supabase
      .from('blog_comments')
      .delete()
      .eq('id', commentId);
      
    if (!error) {
      fetchComments();
    }
  };

  return (
    <div className="mt-16 pt-10 border-t border-gray-200">
      <h3 className="text-2xl font-bold text-gray-900 mb-8">Comments ({comments.length})</h3>
      
      <div className="space-y-8 mb-10">
        {comments.map((comment) => (
          <div key={comment.id} className="flex space-x-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-banner-dark flex items-center justify-center text-white font-bold">
                {(comment.profiles?.full_name || 'U')[0].toUpperCase()}
              </div>
            </div>
            <div className="flex-grow">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">{comment.profiles?.full_name || 'Anonymous User'}</h4>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                  {user && user.id === comment.user_id && (
                    <button 
                      onClick={() => handleDelete(comment.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-2 text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-gray-500 italic">No comments yet. Be the first to share your thoughts!</p>
        )}
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="mt-6">
          <div>
            <label htmlFor="comment" className="sr-only">Add your comment</label>
            <textarea
              id="comment"
              name="comment"
              rows={4}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-banner-dark focus:ring-banner-dark p-3 border"
              placeholder="Add your comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required
            ></textarea>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-banner-dark hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-banner-dark disabled:opacity-50"
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 p-6 rounded-lg text-center border border-gray-200">
          <h4 className="text-lg font-medium text-gray-900 mb-2">Join the conversation</h4>
          <p className="text-gray-500 mb-4">You need to sign in to leave a comment.</p>
          <button
            onClick={handleSignIn}
            className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-banner-dark"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      )}
    </div>
  );
}
