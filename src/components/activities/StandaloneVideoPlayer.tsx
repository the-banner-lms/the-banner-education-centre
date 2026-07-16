'use client'

import { useState } from 'react'
import { PlayIcon } from '@heroicons/react/24/solid'
import type { ActivityMedia } from '@/app/actions/activitiesActions'

export default function StandaloneVideoPlayer({ video }: { video: ActivityMedia }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  const videoId = getYouTubeId(video.url)

  if (!videoId) return null

  const title = video.caption || 'YouTube video'
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-100 transition-transform duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="relative w-full aspect-video">
        {isPlaying ? (
          <>
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-sm font-semibold text-banner-dark">
                Loading video…
              </div>
            )}
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
              title={title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={() => setIsLoaded(true)}
              className={`absolute inset-0 transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          </>
        ) : (
          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            aria-label={`Play ${title}`}
            className="group absolute inset-0 w-full overflow-hidden bg-gray-900 text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-banner-light focus-visible:ring-inset"
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
              style={{ backgroundImage: `url(${thumbnailUrl})` }}
            />
            <span aria-hidden="true" className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/35" />
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-xl transition-transform group-hover:scale-110">
                <PlayIcon className="ml-1 h-8 w-8" />
              </span>
            </span>
          </button>
        )}
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
