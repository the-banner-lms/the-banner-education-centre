import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getAlbumById, getAlbumMedia } from '@/app/actions/activitiesActions'
import ManageMediaForm from '@/components/activities/ManageMediaForm'
import Link from 'next/link'

export const metadata = {
  title: 'Manage Album | Staff',
}

export default async function StaffManageAlbumPage({ params }: { params: Promise<{ id: string }> }) {
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

  if (!profile || profile.role !== 'staff') {
    redirect('/dashboard')
  }

  const { id } = await params
  const album = await getAlbumById(id)
  if (!album) {
    return <div className="p-8 text-center text-gray-500">Album not found.</div>
  }

  const media = await getAlbumMedia(id)

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/staff/activities" className="text-blue-600 hover:text-blue-800 text-sm font-semibold mb-2 inline-block">
            &larr; Back to Activities
          </Link>
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-gray-900">{album.title}</h1>
            <Link href={`/staff/activities/${album.id}/edit`} className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold py-1 px-3 rounded">
              Edit Details
            </Link>
          </div>
          {album.description && <p className="text-gray-500 mt-1">{album.description}</p>}
        </div>
      </div>

      <ManageMediaForm albumId={album.id} existingMedia={media} />
    </div>
  )
}
