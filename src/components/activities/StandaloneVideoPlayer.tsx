'use client'

import type { ActivityMedia } from '@/app/actions/activitiesActions'

export default function StandaloneVideoPlayer({ video }: { video: ActivityMedia }) {
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  const videoId = getYouTubeId(video.url)

  if (!videoId) return null

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-100 transition-transform duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="relative w-full aspect-video">
        <iframe 
          width="100%" 
          height="100%" 
          src={`https://www.youtube.com/embed/${videoId}`} 
          title={video.caption || "YouTube video"} 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
          className="absolute inset-0"
        ></iframe>
      </div>
      {video.caption && (
        <div className="p-4 bg-white">
          <p className="text-lg font-medium text-banner-dark line-clamp-2">
            {video.caption}
          </p>
        </div>
      )}
    </div>
  )
}
