'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateAlbum, deleteAlbum } from '@/app/actions/activitiesActions'
import type { Album } from '@/app/actions/activitiesActions'

export default function EditAlbumForm({ album, basePath }: { album: Album, basePath: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      await updateAlbum(album.id, formData)
      router.push(`${basePath}/${album.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to update album')
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this album and ALL its media? This cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      await deleteAlbum(album.id)
      router.push(basePath)
    } catch (err: any) {
      setError(err.message || 'Failed to delete album')
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-md text-sm">{error}</div>
        )}
        
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Album Title
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="title"
              id="title"
              defaultValue={album.title}
              required
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description (Optional)
          </label>
          <div className="mt-1">
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={album.description || ''}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
            />
          </div>
        </div>

        <div>
          <label htmlFor="coverFile" className="block text-sm font-medium text-gray-700">
            Change Cover Image (Optional)
          </label>
          <div className="mt-1">
            <input
              type="file"
              name="coverFile"
              id="coverFile"
              accept="image/*"
              className="shadow-sm block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
            />
          </div>
          {album.cover_image_url && (
            <p className="mt-2 text-sm text-gray-500">Leave empty to keep the current cover image.</p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || isDeleting}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      <div className="bg-red-50 p-6 rounded-lg border border-red-200">
        <h3 className="text-lg font-medium text-red-800 mb-2">Danger Zone</h3>
        <p className="text-sm text-red-600 mb-4">Deleting this album will permanently remove all photos and videos inside it.</p>
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading || isDeleting}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
        >
          {isDeleting ? 'Deleting...' : 'Delete Album'}
        </button>
      </div>
    </div>
  )
}
