'use server'

import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const maximumPhotoSize = 5 * 1024 * 1024
const photoExtensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

async function verifyAdminAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Only admins can manage team members.')
  }
}

function requiredText(formData: FormData, key: string) {
  const value = formData.get(key)
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${key === 'name' ? 'Full name' : 'Role'} is required.`)
  }
  return value.trim()
}

function optionalText(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeImageUrl(value: string) {
  if (!value) return null
  if (value.startsWith('/')) return value

  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') throw new Error()
    return url.toString()
  } catch {
    throw new Error('Image URL must be a valid HTTPS URL or a local /images path.')
  }
}

function getOrderIndex(formData: FormData) {
  const value = Number.parseInt(optionalText(formData, 'order_index') || '0', 10)
  if (!Number.isFinite(value)) throw new Error('Order must be a valid number.')
  return value
}

function getPhoto(formData: FormData) {
  const entry = formData.get('profile_photo')
  if (!(entry instanceof File) || entry.size === 0) return null

  if (!photoExtensions[entry.type]) {
    throw new Error('Profile photo must be a JPG, PNG, or WebP image.')
  }
  if (entry.size > maximumPhotoSize) {
    throw new Error('Profile photo must be 5 MB or smaller.')
  }
  return entry
}

async function uploadTeamPhoto(photo: File) {
  const extension = photoExtensions[photo.type]
  const filePath = `team/${Date.now()}-${crypto.randomUUID()}.${extension}`
  const { error } = await supabaseAdmin.storage
    .from('avatars')
    .upload(filePath, photo, {
      contentType: photo.type,
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Unable to upload team profile photo:', error)
    throw new Error('Failed to upload profile photo.')
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('avatars')
    .getPublicUrl(filePath)
  return publicUrl
}

function revalidateTeamPages(id?: string) {
  revalidatePath('/team')
  revalidatePath('/admin/team')
  if (id) {
    revalidatePath(`/team/${id}`)
    revalidatePath(`/admin/team/${id}/edit`)
  }
}

export async function createTeamMember(formData: FormData) {
  await verifyAdminAccess()

  const name = requiredText(formData, 'name')
  const role = requiredText(formData, 'role')
  const bio = optionalText(formData, 'bio') || null
  const order_index = getOrderIndex(formData)
  const photo = getPhoto(formData)
  let image_url = normalizeImageUrl(optionalText(formData, 'image_url'))

  if (photo) image_url = await uploadTeamPhoto(photo)

  const { data, error } = await supabaseAdmin
    .from('team_members')
    .insert({ name, role, bio, image_url, order_index })
    .select('id')
    .single()

  if (error) {
    console.error('Unable to create team member:', error)
    throw new Error('Failed to create team member.')
  }

  revalidateTeamPages(data.id)
  redirect('/admin/team')
}

export async function updateTeamMember(id: string, formData: FormData) {
  await verifyAdminAccess()

  const name = requiredText(formData, 'name')
  const role = requiredText(formData, 'role')
  const bio = optionalText(formData, 'bio') || null
  const order_index = getOrderIndex(formData)
  const photo = getPhoto(formData)
  const removePhoto = optionalText(formData, 'remove_photo') === 'true'
  let image_url = removePhoto ? null : normalizeImageUrl(optionalText(formData, 'image_url'))

  if (photo) image_url = await uploadTeamPhoto(photo)

  const { error } = await supabaseAdmin
    .from('team_members')
    .update({ name, role, bio, image_url, order_index })
    .eq('id', id)

  if (error) {
    console.error('Unable to update team member:', error)
    throw new Error('Failed to update team member.')
  }

  revalidateTeamPages(id)
  redirect('/admin/team')
}

export async function deleteTeamMember(id: string) {
  await verifyAdminAccess()

  const { error } = await supabaseAdmin
    .from('team_members')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Unable to delete team member:', error)
    throw new Error('Failed to delete team member.')
  }

  revalidateTeamPages(id)
  return { success: true }
}
