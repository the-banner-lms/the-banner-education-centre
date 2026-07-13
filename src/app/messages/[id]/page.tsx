import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getMessages, markMessagesAsRead } from '@/utils/supabase/messages'
import ChatUI from '@/components/messages/ChatUI'

export const metadata = {
  title: 'Chat | The Banner Education Centre',
}

export const dynamic = 'force-dynamic'

export default async function ChatPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const otherUserId = params.id
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Prevent chatting with oneself
  if (user.id === otherUserId) {
    redirect('/messages')
  }

  // Fetch other user profile
  const { data: otherUser } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, role')
    .eq('id', otherUserId)
    .single()

  if (!otherUser) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <p className="text-red-500">User not found.</p>
        <Link href="/messages" className="text-indigo-600 hover:underline mt-4 inline-block">Back to Messages</Link>
      </div>
    )
  }

  // Mark unread messages from this user as read
  await markMessagesAsRead(supabase, otherUserId)

  // Fetch message history
  const initialMessages = await getMessages(supabase, otherUserId)

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center">
        <Link href="/messages" className="text-indigo-600 hover:text-indigo-800 mr-4 font-medium flex items-center">
          &larr; Back
        </Link>
      </div>

      <ChatUI 
        currentUserId={user.id} 
        otherUser={otherUser} 
        initialMessages={initialMessages} 
      />
    </div>
  )
}
