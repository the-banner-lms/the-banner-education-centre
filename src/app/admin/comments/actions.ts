'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteComment(commentId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('blog_comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/comments')
  return { success: true }
}
