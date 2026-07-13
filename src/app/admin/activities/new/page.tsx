import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import CreateAlbumForm from '@/components/activities/CreateAlbumForm'

export const metadata = {
  title: 'Create Album | Admin',
}

export default async function NewAlbumPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Album</h1>
      </div>
      <CreateAlbumForm />
    </div>
  )
}
