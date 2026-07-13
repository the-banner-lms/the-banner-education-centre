import { SupabaseClient } from '@supabase/supabase-js'

export type DirectMessage = {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
  sender?: { full_name: string, avatar_url: string, role: string }
  receiver?: { full_name: string, avatar_url: string, role: string }
}

export async function getMessages(
  supabase: SupabaseClient,
  otherUserId: string
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('direct_messages')
    .select(`
      *,
      sender:sender_id(full_name, avatar_url, role),
      receiver:receiver_id(full_name, avatar_url, role)
    `)
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }

  return (data || []) as DirectMessage[]
}

export async function getConversations(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Fetch all messages involving the user to determine recent conversations
  const { data, error } = await supabase
    .from('direct_messages')
    .select(`
      *,
      sender:sender_id(full_name, avatar_url, role),
      receiver:receiver_id(full_name, avatar_url, role)
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching conversations:', error)
    return []
  }

  const conversationsMap = new Map<string, DirectMessage>()
  
  if (data) {
    for (const msg of data as DirectMessage[]) {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
      if (!conversationsMap.has(otherId)) {
        conversationsMap.set(otherId, msg)
      }
    }
  }

  return Array.from(conversationsMap.values())
}

export async function markMessagesAsRead(
  supabase: SupabaseClient,
  senderId: string
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('direct_messages')
    .update({ is_read: true })
    .eq('sender_id', senderId)
    .eq('receiver_id', user.id)
    .eq('is_read', false)

  if (error) {
    console.error('Error marking messages as read:', error)
  }
}

export async function getAllMessagesForAdmin(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('direct_messages')
    .select(`
      *,
      sender:sender_id(full_name, avatar_url, role),
      receiver:receiver_id(full_name, avatar_url, role)
    `)
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    console.error('Error fetching all messages for admin:', error)
    return []
  }

  return (data || []) as DirectMessage[]
}
