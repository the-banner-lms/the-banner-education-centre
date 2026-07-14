'use client'

import { useState } from 'react'
import { addStandaloneVideo, deleteStandaloneVideo, updateMediaCaption } from '@/app/actions/activitiesActions'
import type { ActivityMedia } from '@/app/actions/activitiesActions'
import { TrashIcon } from '@heroicons/react/24/outline'

export default function ManageStandaloneVideos({ videos }: { videos: ActivityMedia[] }) {
  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState('')
  const [caption, setCaption] = useState('')

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return
    setLoading(true)
    try {
      await addStandaloneVideo(url, caption)
      setUrl('')
      setCaption('')
    } catch {
      alert('Error adding video')
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this video?')) {
      try {
        await deleteStandaloneVideo(id)
      } catch {
        alert('Error deleting video')
      }
    }
  }

  const handleUpdateCaption = async (id: string, newCaption: string) => {
    try {
      await updateMediaCaption(id, '', newCaption, true)
    } catch {
      alert('Error updating caption')
    }
  }

  return (
    <div className="mt-12 bg-white shadow sm:rounded-lg p-6 border-t-4 border-blue-600">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Standalone Videos</h2>
      
      <form onSubmit={handleAddVideo} className="mb-8 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">YouTube URL</label>
          <input 
            type="url" 
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Caption (Optional)</label>
          <input 
            type="text" 
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            placeholder="Video title"
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50 h-[42px]"
        >
          {loading ? 'Adding...' : 'Add Video'}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {videos.map(video => (
          <div key={video.id} className="relative group bg-gray-100 rounded-lg overflow-hidden p-2 flex flex-col">
            <div className="w-full aspect-video mb-2">
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${getYouTubeId(video.url)}`} 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
            
            <input 
              type="text"
              defaultValue={video.caption || ''}
              placeholder="Add a caption..."
              className="w-full text-sm p-2 border rounded border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              onBlur={(e) => {
                if (e.target.value !== video.caption) {
                  handleUpdateCaption(video.id, e.target.value)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur()
                }
              }}
            />

            <button 
              onClick={() => handleDelete(video.id)}
              className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete video"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        ))}
        {videos.length === 0 && <p className="text-gray-500 italic md:col-span-2">No videos added yet.</p>}
      </div>
    </div>
  )
}
