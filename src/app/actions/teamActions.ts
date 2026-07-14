'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createTeamMember(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const role = formData.get('role') as string
  const email = formData.get('email') as string
  const about = formData.get('about') as string
  const image = formData.get('image') as string // Or handle file upload separately
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  const skillsString = formData.get('skills') as string
  const skills = skillsString.split(',').map(s => s.trim()).filter(Boolean)

  const degree = formData.get('degree') as string
  const university = formData.get('university') as string
  const education = { degree, university }

  const { error } = await supabase
    .from('team_members')
    .insert([
      { name, role, email, about, image, slug, skills, education }
    ])

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/team')
  revalidatePath('/admin/team')
  redirect('/admin/team')
}

export async function updateTeamMember(id: string, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const role = formData.get('role') as string
  const email = formData.get('email') as string
  const about = formData.get('about') as string
  const image = formData.get('image') as string
  const slug = formData.get('slug') as string || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  const skillsString = formData.get('skills') as string
  const skills = skillsString.split(',').map(s => s.trim()).filter(Boolean)

  const degree = formData.get('degree') as string
  const university = formData.get('university') as string
  const education = { degree, university }

  const { error } = await supabase
    .from('team_members')
    .update({ name, role, email, about, image, slug, skills, education })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/team')
  revalidatePath('/admin/team')
  redirect('/admin/team')
}

export async function deleteTeamMember(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/team')
  revalidatePath('/admin/team')
  return { success: true }
}
