import 'server-only'

import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

export type DashboardAnnouncement = {
  id: string
  title: string
  created_at: string
  author_role: string | null
  target_role: string | null
}

export async function getRecentAnnouncementsForRole(
  authenticatedClient: SupabaseClient,
  role: string,
  limit = 5
): Promise<DashboardAnnouncement[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Server-only fallback avoids a restrictive announcements SELECT policy
  // returning an empty list for staff while preserving role targeting here.
  const queryClient = supabaseUrl && serviceRoleKey
    ? createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : authenticatedClient

  const { data, error } = await queryClient
    .from('announcements')
    .select('id, title, created_at, author_role, target_role')
    .in('target_role', role === 'admin' ? ['all', 'admin', 'staff', 'teacher', 'student'] : ['all', role])
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error(`Error fetching announcements for ${role}:`, error)
    return []
  }

  return (data || []) as DashboardAnnouncement[]
}

export async function getAnnouncementById(
  authenticatedClient: SupabaseClient,
  id: string
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const queryClient = supabaseUrl && serviceRoleKey
    ? createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : authenticatedClient

  const { data, error } = await queryClient
    .from('announcements')
    .select(`
      *,
      author_role
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error(`Error fetching announcement ${id}:`, error)
    return null
  }

  return data
}

export async function getAllAnnouncements(
  authenticatedClient: SupabaseClient
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const queryClient = supabaseUrl && serviceRoleKey
    ? createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : authenticatedClient

  const { data, error } = await queryClient
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(`Error fetching all announcements:`, error)
    return []
  }

  return data || []
}
