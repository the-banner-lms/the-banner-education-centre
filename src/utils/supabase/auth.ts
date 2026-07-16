import { cache } from 'react'
import { cookies } from 'next/headers'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { hasSupabaseAuthCookie } from '@/utils/supabase/cookies'
import type { Profile } from '@/utils/supabase/queries'

type CurrentAuth = {
  user: User | null
  profile: Profile | null
  supabase: Awaited<ReturnType<typeof createClient>>
}

// Navbar, AuthGuard and route pages render in the same server request. React
// cache ensures they share one authenticated-user/profile lookup instead of
// repeating the same Supabase requests during every navigation.
export const getCurrentAuth = cache(async (): Promise<CurrentAuth> => {
  const cookieStore = await cookies()
  const supabase = await createClient()

  // Public visitors have no session to validate. Avoid a remote auth request
  // on every page render so public navigation can respond immediately.
  if (!hasSupabaseAuthCookie(cookieStore.getAll())) {
    return { user: null, profile: null, supabase }
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, profile: null, supabase }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching current user profile:', error)
  }

  return {
    user,
    profile: error ? null : data as Profile,
    supabase,
  }
})
