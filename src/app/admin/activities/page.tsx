import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAlbums, getStandaloneVideos } from '@/app/actions/activitiesActions'
import { PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/outline'
import ManageStandaloneVideos from '@/components/activities/ManageStandaloneVideos'

export const metadata = {
  title: 'Manage Activities | Admin',
}

export default async function AdminActivitiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify admin access
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  const albums = await getAlbums()
  const videos = await getStandaloneVideos()

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Activities & Albums</h1>
        <Link 
          href="/admin/activities/new"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          + Create New Album
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {albums.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No albums found. Create your first album!
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200">
            {albums.map((album) => (
              <li key={album.id}>
                <Link href={`/admin/activities/${album.id}`} className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6 flex items-center">
                    <div className="flex-shrink-0 h-16 w-16 bg-gray-100 rounded-md overflow-hidden mr-4">
                      {album.cover_image_url ? (
                        <img src={album.cover_image_url} alt={album.title} className="h-full w-full object-cover" />
                      ) : (
                        <PhotoIcon className="h-full w-full p-4 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-medium text-blue-600 truncate">{album.title}</p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Manage Media
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex">
                        <div className="flex items-center text-sm text-gray-500 line-clamp-1">
                          {album.description || 'No description'}
                        </div>
                      </div>
                      <div className="mt-1 flex items-center text-xs text-gray-400">
                        Created on {new Date(album.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ManageStandaloneVideos videos={videos} />
    </div>
  )
}
