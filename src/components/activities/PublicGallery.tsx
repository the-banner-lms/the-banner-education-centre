'use client'

import { useState } from 'react'
import type { ActivityMedia } from '@/app/actions/activitiesActions'
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export default function PublicGallery({ media }: { media: ActivityMedia[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % media.length)
    }
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + media.length) % media.length)
    }
  }

  return (
    <div>
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {media.map((item, index) => (
          <div 
            key={item.id} 
            className="relative cursor-pointer group rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border-[3px] border-white bg-banner-light/5 aspect-video sm:aspect-square transition-all duration-300"
            onClick={() => setSelectedIndex(index)}
          >
            {item.media_type === 'photo' ? (
              <img src={item.url} alt={item.caption || 'Photo'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" />
            ) : (
              <div className="w-full h-full relative">
                <img 
                  src={`https://img.youtube.com/vi/${getYouTubeId(item.url)}/hqdefault.jpg`} 
                  alt={item.caption || 'Video'} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                  onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/480x360?text=Video' }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-transparent transition-colors duration-300">
                  <div className="bg-red-600/90 group-hover:bg-red-600 rounded-full w-14 h-14 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all duration-300">
                    <div className="w-0 h-0 border-t-8 border-t-transparent border-l-[16px] border-l-white border-b-8 border-b-transparent ml-1"></div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-banner-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="absolute bottom-0 left-0 w-full p-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-white text-sm font-medium line-clamp-2 drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                {item.caption || (item.media_type === 'photo' ? 'Photo' : 'Video')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setSelectedIndex(null)}>
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
            onClick={(e) => { e.stopPropagation(); setSelectedIndex(null); }}
          >
            <XMarkIcon className="w-10 h-10" />
          </button>

          <button 
            className="absolute left-4 text-white hover:text-gray-300 p-2 z-50"
            onClick={handlePrev}
          >
            <ChevronLeftIcon className="w-12 h-12" />
          </button>

          <div className="max-w-5xl w-full max-h-full p-4 flex flex-col items-center justify-center relative" onClick={(e) => e.stopPropagation()}>
            {media[selectedIndex].media_type === 'photo' ? (
              <img 
                src={media[selectedIndex].url} 
                alt={media[selectedIndex].caption || 'Photo'} 
                className="max-w-full max-h-[80vh] object-contain"
              />
            ) : (
              <div className="w-full aspect-video">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={`https://www.youtube.com/embed/${getYouTubeId(media[selectedIndex].url)}?autoplay=1`} 
                  title="YouTube video player" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>
            )}
            <div className="mt-4 text-center">
              <p className="text-white text-xl font-medium">{media[selectedIndex].caption}</p>
              <p className="text-gray-400 text-sm mt-1">{selectedIndex + 1} of {media.length}</p>
            </div>
          </div>

          <button 
            className="absolute right-4 text-white hover:text-gray-300 p-2 z-50"
            onClick={handleNext}
          >
            <ChevronRightIcon className="w-12 h-12" />
          </button>
        </div>
      )}
    </div>
  )
}
