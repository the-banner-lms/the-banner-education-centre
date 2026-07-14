import { SupabaseClient } from '@supabase/supabase-js'

export type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'admin' | 'editor' | 'teacher' | 'student' | 'staff' | 'guest'
  approval_status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export async function getUserProfile(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data as Profile
}

export async function isAdmin(supabase: SupabaseClient) {
  const profile = await getUserProfile(supabase)
  return profile?.role === 'admin'
}

export async function hasAdminPanelAccess(supabase: SupabaseClient) {
  const profile = await getUserProfile(supabase)
  return profile?.role === 'admin'
}

export async function isTeacher(supabase: SupabaseClient) {
  const profile = await getUserProfile(supabase)
  return profile?.role === 'teacher' || profile?.role === 'staff' || profile?.role === 'admin'
}

export async function isStaff(supabase: SupabaseClient) {
  const profile = await getUserProfile(supabase)
  return profile?.role === 'staff' || profile?.role === 'admin'
}

const roleLevels = {
  admin: 40,
  staff: 30,
  teacher: 20,
  student: 10,
}

export function canViewDashboard(viewerRole: string, targetRole: string): boolean {
  if (viewerRole === 'admin') return true;
  
  const viewerLevel = roleLevels[viewerRole as keyof typeof roleLevels] || 0;
  const targetLevel = roleLevels[targetRole as keyof typeof roleLevels] || 0;
  return viewerLevel > targetLevel;
}
