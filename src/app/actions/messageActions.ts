'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendMessage(receiverId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  if (!content.trim()) {
    return { error: 'Message cannot be empty' }
  }

  const { error } = await supabase
    .from('direct_messages')
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content: content.trim()
    })

  if (error) {
    console.error('Error sending message:', error)
    return { error: 'Failed to send message' }
  }

  // Revalidate relevant paths
  revalidatePath('/messages')
  revalidatePath(`/messages/${receiverId}`)
  revalidatePath('/admin/messages')

  return { success: true }
}
