'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createTeamMember(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const role = formData.get('role') as string
  const bio = formData.get('bio') as string
  const image_url = formData.get('image_url') as string
  const order_index = parseInt(formData.get('order_index') as string || '0', 10)

  const { error } = await supabase
    .from('team_members')
    .insert([
      { name, role, bio, image_url, order_index }
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
  const bio = formData.get('bio') as string
  const image_url = formData.get('image_url') as string
  const order_index = parseInt(formData.get('order_index') as string || '0', 10)

  const { error } = await supabase
    .from('team_members')
    .update({ name, role, bio, image_url, order_index })
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
