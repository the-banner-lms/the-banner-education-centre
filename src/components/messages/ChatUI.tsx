'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { sendMessage } from '@/app/actions/messageActions'
import { DirectMessage } from '@/utils/supabase/messages'

export default function ChatUI({ 
  currentUserId, 
  otherUser, 
  initialMessages 
}: { 
  currentUserId: string, 
  otherUser: any, 
  initialMessages: DirectMessage[] 
}) {
  const [messages, setMessages] = useState<DirectMessage[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [supabase] = useState(() => createClient())

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Subscribe to real-time new messages
  useEffect(() => {
    const channel = supabase
      .channel('direct_messages_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `sender_id=eq.${otherUser.id}`,
        },
        (payload) => {
          // If the message is from the other user and for us
          if (payload.new.receiver_id === currentUserId) {
            // Optimistically append, ideally fetch relations, but we can mock it
            const newMsg = {
              ...payload.new,
              sender: { full_name: otherUser.full_name, avatar_url: otherUser.avatar_url, role: otherUser.role }
            } as DirectMessage
            
            setMessages((prev) => [...prev, newMsg])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, otherUser.avatar_url, otherUser.full_name, otherUser.id, otherUser.role, supabase])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    const content = newMessage.trim()
    
    // Optimistic UI update
    const tempId = `temp-${Date.now()}`
    const optimisticMsg: DirectMessage = {
      id: tempId,
      sender_id: currentUserId,
      receiver_id: otherUser.id,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
      sender: { full_name: 'You', avatar_url: '', role: '' }
    }
    
    setMessages(prev => [...prev, optimisticMsg])
    setNewMessage('')

    const res = await sendMessage(otherUser.id, content)
    
    if (res.error) {
      alert(res.error)
      // Rollback optimistic update
      setMessages(prev => prev.filter(m => m.id !== tempId))
    }
    
    setIsSending(false)
  }

  return (
    <div className="flex flex-col h-[600px] bg-white shadow sm:rounded-lg overflow-hidden border border-gray-200">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center">
        <div className="flex-shrink-0 mr-4">
          {otherUser.avatar_url ? (
            <img className="h-10 w-10 rounded-full object-cover" src={otherUser.avatar_url} alt="" referrerPolicy="no-referrer" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-bold">
              {otherUser.full_name?.charAt(0) || '?'}
            </div>
          )}
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{otherUser.full_name || otherUser.email}</h2>
          <p className="text-xs text-gray-500 capitalize">{otherUser.role}</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-6 overflow-y-auto bg-gray-50 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-900 shadow-sm border border-gray-100 rounded-bl-none'
                }`}>
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSend} className="flex space-x-4">
          <input
            type="text"
            className="flex-1 block w-full rounded-full border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-50"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
