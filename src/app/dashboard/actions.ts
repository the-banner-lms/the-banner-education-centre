'use server'

import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateOwnEmail(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const newEmail = formData.get('email') as string
  if (!newEmail || !newEmail.includes('@')) {
    return { error: 'Invalid email address' }
  }

  // Check if email is already in use by someone else
  const { data: existingUser } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', newEmail)
    .single()
    
  if (existingUser && existingUser.id !== user.id) {
    return { error: 'This email is already registered.' }
  }

  // Update in auth.users via Admin API to bypass confirmation
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    { email: newEmail, email_confirm: true }
  )

  if (authError) {
    return { error: authError.message }
  }

  // Update profiles table
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ email: newEmail })
    .eq('id', user.id)

  if (profileError) {
    // If it fails here, we have a mismatch but auth is updated. 
    return { error: profileError.message }
  }

  revalidatePath('/dashboard')
  return { success: 'Email updated successfully!' }
}
