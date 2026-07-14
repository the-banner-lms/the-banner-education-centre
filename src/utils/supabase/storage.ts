import { createClient } from '@/utils/supabase/client'

export async function uploadBlogImage(file: File): Promise<string | null> {
  const supabase = createClient()
  
  // Create a unique file name
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
  const filePath = `${fileName}`

  try {
    const { error } = await supabase.storage
      .from('blog_images')
      .upload(filePath, file)

    if (error) {
      console.error('Error uploading image:', error)
      return null
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('blog_images')
      .getPublicUrl(filePath)

    return publicUrl
  } catch (err) {
    console.error('Unexpected error uploading image:', err)
    return null
  }
}
