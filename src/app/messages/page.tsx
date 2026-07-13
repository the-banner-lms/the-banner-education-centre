import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getConversations } from '@/utils/supabase/messages'

export const metadata = {
  title: 'Messages | The Banner Education Centre',
}

export const dynamic = 'force-dynamic'

export default async function MessagesInboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const conversations = await getConversations(supabase)

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <Link 
          href="/messages/new" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          New Message
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No messages yet. Start a new conversation!
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {conversations.map((msg) => {
              const isSender = msg.sender_id === user.id
              const otherUser = isSender ? msg.receiver : msg.sender
              const otherUserId = isSender ? msg.receiver_id : msg.sender_id
              const unread = !isSender && !msg.is_read

              return (
                <li key={msg.id}>
                  <Link href={`/messages/${otherUserId}`} className="block hover:bg-gray-50 transition-colors">
                    <div className="px-4 py-4 sm:px-6 flex items-center">
                      <div className="flex-shrink-0 mr-4">
                        {otherUser?.avatar_url ? (
                          <img className="h-12 w-12 rounded-full object-cover" src={otherUser.avatar_url} alt="" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-bold text-lg">
                            {otherUser?.full_name?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium truncate ${unread ? 'text-gray-900 font-bold' : 'text-indigo-600'}`}>
                            {otherUser?.full_name || 'Unknown User'} 
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                              {otherUser?.role}
                            </span>
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="text-sm text-gray-500">
                              {new Date(msg.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between">
                          <div className="sm:flex">
                            <p className={`flex items-center text-sm truncate ${unread ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                              {isSender && <span className="mr-1 text-gray-400">You: </span>}
                              {msg.content}
                            </p>
                          </div>
                          {unread && (
                            <div className="ml-2 flex-shrink-0">
                              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-indigo-600 rounded-full">New</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
