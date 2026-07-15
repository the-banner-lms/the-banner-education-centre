'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

function getSafeNextPath(formData: FormData) {
  const next = formData.get('next')
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : ''
}

export async function login(formData: FormData) {
  const supabase = await createClient()
  
  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  const { data: { user } } = await supabase.auth.getUser()
  let redirectUrl = getSafeNextPath(formData) || '/'
  
  if (user) {
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      
    if (userProfile && !getSafeNextPath(formData)) {
      switch (userProfile.role) {
        case 'student':
          redirectUrl = '/dashboard'
          break
        case 'teacher':
          redirectUrl = '/teacher'
          break
        case 'staff':
          redirectUrl = '/staff'
          break
        case 'admin':
          redirectUrl = '/admin'
          break
        default:
          redirectUrl = '/'
      }
    }
  }

  revalidatePath('/', 'layout')
  redirect(redirectUrl)
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: formData.get('fullName') as string,
      }
    }
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  const { data: { user } } = await supabase.auth.getUser()
  let redirectUrl = getSafeNextPath(formData) || '/'
  
  if (user) {
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      
    if (userProfile && !getSafeNextPath(formData)) {
      switch (userProfile.role) {
        case 'student':
          redirectUrl = '/dashboard'
          break
        case 'teacher':
          redirectUrl = '/teacher'
          break
        case 'staff':
          redirectUrl = '/staff'
          break
        case 'admin':
          redirectUrl = '/admin'
          break
        default:
          redirectUrl = '/'
      }
    }
  }

  revalidatePath('/', 'layout')
  redirect(redirectUrl)
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
