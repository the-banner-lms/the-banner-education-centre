import { createClient } from '@/utils/supabase/server'
import { isAdmin } from '@/utils/supabase/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DeleteCommentButton from './DeleteCommentButton'

export const dynamic = 'force-dynamic'

export default async function AdminCommentsPage() {
  const supabase = await createClient()

  const isFullAdmin = await isAdmin(supabase)
  if (!isFullAdmin) {
    redirect('/admin')
  }

  // Fetch comments joined with blog title and user profile
  const { data: comments, error } = await supabase
    .from('blog_comments')
    .select(`
      id,
      content,
      created_at,
      post_id,
      blogs ( title ),
      profiles ( full_name, email )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return <div>Error loading comments.</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8 text-gray-900">Blog Comments Management</h1>
      
      <div className="mb-10 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">All Comments</h2>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comment
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                  Blog Post
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {comments.map((comment: any) => (
                <tr key={comment.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {comment.profiles?.full_name || 'Unknown User'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {comment.profiles?.email || 'No email'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700 line-clamp-3 max-w-md">
                      {comment.content}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <Link href={`/blog/${comment.post_id}`} target="_blank" className="text-indigo-600 hover:text-indigo-900 hover:underline line-clamp-2">
                      {comment.blogs?.title || 'Unknown Post'}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(comment.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <DeleteCommentButton commentId={comment.id} />
                  </td>
                </tr>
              ))}
              {comments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                    No comments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
