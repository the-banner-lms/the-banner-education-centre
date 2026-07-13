'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

async function verifyStaffAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const hasAccess = profile?.role === 'admin' || profile?.role === 'staff'
  if (!hasAccess) {
    throw new Error('Unauthorized: Only staff/admins can perform this action.')
  }
}

async function verifyAdminAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Unauthorized: Only admins can perform this action.')
  }
}

// Define Types
export type Album = {
  id: string
  title: string
  description: string | null
  created_at: string
  cover_image_url?: string | null
}

export type ActivityMedia = {
  id: string
  album_id: string
  media_type: 'photo' | 'video'
  url: string
  caption: string | null
  created_at: string
}

export async function createAlbum(formData: FormData) {
  await verifyStaffAccess() // Allow both admin and staff

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const coverFile = formData.get('coverFile') as File | null

  if (!title) throw new Error('Title is required')

  let cover_image_url = null

  // 1. Upload Cover Image if provided
  if (coverFile && coverFile.size > 0) {
    const fileExt = coverFile.name.split('.').pop()
    const fileName = `album-covers/${Date.now()}-${Math.random()}.${fileExt}`
    
    const { data, error: uploadError } = await supabaseAdmin.storage
      .from('activities')
      .upload(fileName, coverFile)

    if (uploadError) {
      console.error('Error uploading cover:', uploadError)
      throw new Error('Failed to upload cover image')
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('activities')
      .getPublicUrl(fileName)
    
    cover_image_url = publicUrl
  }

  // 2. Insert Album
  const { data: newAlbum, error } = await supabaseAdmin
    .from('albums')
    .insert({
      title,
      description,
      cover_image_url
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating album:', error)
    throw new Error('Failed to create album')
  }

  revalidatePath('/admin/activities')
  revalidatePath('/staff/activities')
  revalidatePath('/activities')
  
  return newAlbum as Album
}

export async function updateAlbum(albumId: string, formData: FormData) {
  await verifyStaffAccess()

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const coverFile = formData.get('coverFile') as File | null

  if (!title) throw new Error('Title is required')

  const updates: any = {
    title,
    description
  }

  if (coverFile && coverFile.size > 0) {
    const fileExt = coverFile.name.split('.').pop()
    const fileName = `album-covers/${Date.now()}-${Math.random()}.${fileExt}`
    
    const { data, error: uploadError } = await supabaseAdmin.storage
      .from('activities')
      .upload(fileName, coverFile)

    if (uploadError) {
      console.error('Error uploading cover:', uploadError)
      throw new Error('Failed to upload new cover image')
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('activities')
      .getPublicUrl(fileName)
    
    updates.cover_image_url = publicUrl
  }

  const { data: updatedAlbum, error } = await supabaseAdmin
    .from('albums')
    .update(updates)
    .eq('id', albumId)
    .select()
    .single()

  if (error) {
    console.error('Error updating album:', error)
    throw new Error('Failed to update album')
  }

  revalidatePath('/admin/activities')
  revalidatePath('/staff/activities')
  revalidatePath('/activities')
  revalidatePath(`/admin/activities/${albumId}`)
  revalidatePath(`/staff/activities/${albumId}`)
  revalidatePath(`/activities/${albumId}`)
  
  return updatedAlbum as Album
}

export async function deleteAlbum(albumId: string) {
  await verifyStaffAccess()

  // First delete associated media
  const { error: mediaError } = await supabaseAdmin
    .from('activities_media')
    .delete()
    .eq('album_id', albumId)

  if (mediaError) {
    console.error('Error deleting album media:', mediaError)
    throw new Error('Failed to delete album media')
  }

  // Then delete album
  const { error } = await supabaseAdmin
    .from('albums')
    .delete()
    .eq('id', albumId)

  if (error) {
    console.error('Error deleting album:', error)
    throw new Error('Failed to delete album')
  }

  revalidatePath('/admin/activities')
  revalidatePath('/staff/activities')
  revalidatePath('/activities')
}

export async function getAlbums() {
  const { data: albums, error } = await supabaseAdmin
    .from('albums')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching albums:', error)
    throw new Error('Failed to fetch albums')
  }

  // Fetch one photo for each album to use as cover
  const enrichedAlbums = await Promise.all(albums.map(async (album) => {
    const { data: media } = await supabaseAdmin
      .from('activities_media')
      .select('url')
      .eq('album_id', album.id)
      .eq('media_type', 'photo')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    
    return {
      ...album,
      cover_image_url: media?.url || null
    }
  }))

  return enrichedAlbums.filter(album => 
    album.cover_image_url !== null && 
    album.title.toLowerCase() !== 'logo'
  ) as Album[]
}

export async function getAlbumById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('albums')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return null
  }

  return data as Album | null
}

export async function addPhotoToAlbum(albumId: string, formData: FormData) {
  await verifyStaffAccess()

  const files = formData.getAll('files') as File[]
  const customCaption = formData.get('caption') as string
  
  if (!files || files.length === 0) throw new Error('No files provided')

  for (const file of files) {
    if (file.size > 0) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${albumId}/${Date.now()}-${Math.random()}.${fileExt}`
      
      const { data, error: uploadError } = await supabaseAdmin.storage
        .from('activities')
        .upload(fileName, file)

      if (uploadError) {
        console.error('Error uploading photo:', uploadError)
        continue // Skip this file and try next
      }

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('activities')
        .getPublicUrl(fileName)
      
      // Insert to db
      await supabaseAdmin
        .from('activities_media')
        .insert({
          album_id: albumId,
          media_type: 'photo',
          url: publicUrl,
          caption: customCaption ? (files.length > 1 ? `${customCaption} (${files.indexOf(file) + 1})` : customCaption) : file.name
        })
    }
  }

  revalidatePath(`/admin/activities/${albumId}`)
  revalidatePath(`/staff/activities/${albumId}`)
  revalidatePath(`/activities/${albumId}`)
}

export async function updateMediaCaption(mediaId: string, albumId: string, caption: string) {
  await verifyStaffAccess()

  const { error } = await supabaseAdmin
    .from('activities_media')
    .update({ caption })
    .eq('id', mediaId)

  if (error) {
    console.error('Error updating caption:', error)
    throw new Error('Failed to update caption')
  }

  revalidatePath(`/admin/activities/${albumId}`)
  revalidatePath(`/staff/activities/${albumId}`)
  revalidatePath(`/activities/${albumId}`)
}

export async function replacePhoto(mediaId: string, albumId: string, formData: FormData) {
  await verifyStaffAccess()

  const file = formData.get('file') as File
  
  if (!file || file.size === 0) throw new Error('No file provided')

  const fileExt = file.name.split('.').pop()
  const fileName = `${albumId}/${Date.now()}-${Math.random()}.${fileExt}`
  
  const { data, error: uploadError } = await supabaseAdmin.storage
    .from('activities')
    .upload(fileName, file)

  if (uploadError) {
    console.error('Error uploading photo:', uploadError)
    throw new Error('Failed to upload new photo')
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('activities')
    .getPublicUrl(fileName)
  
  // Update db
  const { error } = await supabaseAdmin
    .from('activities_media')
    .update({
      url: publicUrl,
      caption: file.name
    })
    .eq('id', mediaId)
    
  if (error) {
    throw new Error('Failed to update media record')
  }

  revalidatePath(`/admin/activities/${albumId}`)
  revalidatePath(`/staff/activities/${albumId}`)
  revalidatePath(`/activities/${albumId}`)
  revalidatePath('/activities')
}

export async function addVideoToAlbum(albumId: string, formData: FormData) {
  await verifyStaffAccess()

  const youtubeUrl = formData.get('youtubeUrl') as string
  const caption = formData.get('caption') as string

  if (!youtubeUrl) throw new Error('YouTube URL is required')

  const { error } = await supabaseAdmin
    .from('activities_media')
    .insert({
      album_id: albumId,
      media_type: 'video',
      url: youtubeUrl,
      caption: caption || 'YouTube Video'
    })

  if (error) {
    console.error('Error adding video:', error)
    throw new Error('Failed to add video')
  }

  revalidatePath(`/admin/activities/${albumId}`)
  revalidatePath(`/staff/activities/${albumId}`)
  revalidatePath(`/activities/${albumId}`)
}

export async function getAlbumMedia(albumId: string) {
  const { data, error } = await supabaseAdmin
    .from('activities_media')
    .select('*')
    .eq('album_id', albumId)
    .order('created_at', { ascending: false })

  if (error) {
    return []
  }

  return data as ActivityMedia[]
}

export async function deleteMedia(mediaId: string, albumId: string) {
  await verifyStaffAccess()

  const { error } = await supabaseAdmin
    .from('activities_media')
    .delete()
    .eq('id', mediaId)

  if (error) {
    console.error('Error deleting media:', error)
    throw new Error('Failed to delete media')
  }

  revalidatePath(`/admin/activities/${albumId}`)
  revalidatePath(`/staff/activities/${albumId}`)
  revalidatePath(`/activities/${albumId}`)
}
