'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { addPhotoToAlbum, addVideoToAlbum, deleteMedia, replacePhoto, updateMediaCaption } from '@/app/actions/activitiesActions'
import type { ActivityMedia } from '@/app/actions/activitiesActions'
import { TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export default function ManageMediaForm({ albumId, existingMedia }: { albumId: string, existingMedia: ActivityMedia[] }) {
  const router = useRouter()
  const [photoLoading, setPhotoLoading] = useState(false)
  const [videoLoading, setVideoLoading] = useState(false)
  const [replacingId, setReplacingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePhotoUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPhotoLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    try {
      await addPhotoToAlbum(albumId, formData)
      ;(e.target as HTMLFormElement).reset()
    } catch (err: any) {
      setError(err.message || 'Failed to upload photos')
    } finally {
      setPhotoLoading(false)
    }
  }

  const handleVideoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setVideoLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    try {
      await addVideoToAlbum(albumId, formData)
      ;(e.target as HTMLFormElement).reset()
    } catch (err: any) {
      setError(err.message || 'Failed to add video')
    } finally {
      setVideoLoading(false)
    }
  }

  const handleDelete = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this media?')) return
    setError(null)
    try {
      await deleteMedia(mediaId, albumId)
    } catch (err: any) {
      setError(err.message || 'Failed to delete media')
    }
  }

  const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>, mediaId: string) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setReplacingId(mediaId)
    setError(null)
    
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      await replacePhoto(mediaId, albumId, formData)
    } catch (err: any) {
      setError(err.message || 'Failed to replace photo')
    } finally {
      setReplacingId(null)
      e.target.value = '' // reset input
    }
  }

        const handleUpdateCaption = async (mediaId: string, newCaption: string) => {
    try {
      await updateMediaCaption(mediaId, albumId, newCaption)
    } catch (err: any) {
      alert(err.message || 'Failed to update caption')
    }
  }

  // Extract YouTube ID for thumbnail
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  return (
    <div className="space-y-8">
      {error && <div className="bg-red-50 text-red-500 p-4 rounded-md">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Photo Upload Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add Photos</h3>
          <form onSubmit={handlePhotoUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Photos</label>
              <input
                type="file"
                name="files"
                accept="image/*"
                multiple
                required
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Caption (Optional)</label>
              <input
                type="text"
                name="caption"
                placeholder="Caption for these photos"
                className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
              />
            </div>
            <button
              type="submit"
              disabled={photoLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {photoLoading ? 'Uploading...' : 'Upload Photos'}
            </button>
          </form>
        </div>

        {/* Video Link Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add YouTube Video</h3>
          <form onSubmit={handleVideoSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">YouTube URL</label>
              <input
                type="url"
                name="youtubeUrl"
                placeholder="https://www.youtube.com/watch?v=..."
                required
                className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Caption (Optional)</label>
              <input
                type="text"
                name="caption"
                placeholder="Video Title"
                className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
              />
            </div>
            <button
              type="submit"
              disabled={videoLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {videoLoading ? 'Adding...' : 'Add YouTube Video'}
            </button>
          </form>
        </div>
      </div>

      {/* Existing Media Gallery */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Existing Media ({existingMedia.length})</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {existingMedia.map((media) => (
            <div key={media.id} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex flex-col">
              <div className="relative aspect-square">
                {media.media_type === 'photo' ? (
                  <img src={media.url} alt={media.caption || 'Photo'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full relative">
                    <img 
                      src={`https://img.youtube.com/vi/${getYouTubeId(media.url)}/hqdefault.jpg`} 
                      alt={media.caption || 'Video'} 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/480x360?text=Video' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-red-600 rounded-full w-12 h-12 flex items-center justify-center opacity-80">
                        <div className="w-0 h-0 border-t-8 border-t-transparent border-l-[16px] border-l-white border-b-8 border-b-transparent ml-1"></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                  {media.media_type === 'photo' && (
                    <label className={`bg-white text-blue-600 p-2 rounded-full hover:bg-blue-50 cursor-pointer relative ${replacingId === media.id ? 'opacity-50 cursor-not-allowed' : ''}`} title="Replace Photo">
                      <ArrowPathIcon className={`w-6 h-6 ${replacingId === media.id ? 'animate-spin' : ''}`} />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleReplace(e, media.id)}
                        disabled={replacingId === media.id}
                      />
                    </label>
                  )}
                  <button
                    onClick={() => handleDelete(media.id)}
                    className="bg-white text-red-600 p-2 rounded-full hover:bg-red-50 disabled:opacity-50"
                    title="Delete"
                    disabled={replacingId === media.id}
                  >
                    <TrashIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-2 border-t bg-white">
                <input
                  type="text"
                  defaultValue={media.caption || ''}
                  onBlur={(e) => {
                    if (e.target.value !== media.caption) {
                      handleUpdateCaption(media.id, e.target.value)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur()
                    }
                  }}
                  placeholder="Add a caption..."
                  className="w-full text-xs text-gray-700 bg-transparent border-transparent focus:border-blue-300 focus:ring-0 p-1"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
