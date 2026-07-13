'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { isAdmin } from '@/utils/supabase/queries'
import { createClient as createServerClient } from '@/utils/supabase/server'

// Use a service role client to bypass RLS for administrative actions
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function updateUserStatus(userId: string, status: 'approved' | 'rejected', formData?: FormData) {
  // 1. Verify caller is an admin
  const supabase = await createServerClient()
  const hasAdminAccess = await isAdmin(supabase)
  
  if (!hasAdminAccess) {
    throw new Error('Unauthorized: You must be an admin to perform this action.')
  }

  // 2. Update the user profile using the service role client
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ approval_status: status })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user status:', error)
    throw new Error('Failed to update user status.')
  }

  // 3. Revalidate the users admin page to reflect changes
  revalidatePath('/admin/users')
}

export async function updateUserRole(userId: string, role: string, formData?: FormData) {
  // 1. Verify caller is an admin
  const supabase = await createServerClient()
  const hasAdminAccess = await isAdmin(supabase)
  
  if (!hasAdminAccess) {
    throw new Error('Unauthorized: You must be an admin to perform this action.')
  }

  // 2. Update the user profile using the service role client
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user role:', error)
    throw new Error('Failed to update user role.')
  }

  // 3. Revalidate the users admin page to reflect changes
  revalidatePath('/admin/users')
}
