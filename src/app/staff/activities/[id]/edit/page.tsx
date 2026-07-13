import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getAlbumById } from '@/app/actions/activitiesActions'
import EditAlbumForm from '@/components/activities/EditAlbumForm'
import Link from 'next/link'

export const metadata = {
  title: 'Edit Album | Staff',
}

export default async function EditStaffAlbumPage({ params }: { params: Promise<{ id: string }> }) {
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

  if (!profile || (profile.role !== 'staff' && profile.role !== 'admin')) {
    redirect('/dashboard')
  }

  const { id } = await params
  const album = await getAlbumById(id)
  
  if (!album) {
    return <div className="p-8 text-center text-gray-500">Album not found.</div>
  }

  return (
    <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href={`/staff/activities/${album.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-semibold mb-2 inline-block">
          &larr; Back to Album
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Album: {album.title}</h1>
      </div>
      <EditAlbumForm album={album} basePath="/staff/activities" />
    </div>
  )
}
