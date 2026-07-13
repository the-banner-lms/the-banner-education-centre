import { getAlbumById, getAlbumMedia } from '@/app/actions/activitiesActions'
import PublicGallery from '@/components/activities/PublicGallery'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeftIcon, CalendarIcon, PhotoIcon } from '@heroicons/react/24/outline'

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const album = await getAlbumById(id)
  return {
    title: `${album?.title || 'Album'} | The Banner Education Centre`,
  }
}

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const album = await getAlbumById(id)
  
  if (!album) {
    notFound()
  }

  const media = await getAlbumMedia(id)

  return (
    <div className="min-h-screen bg-white flex flex-col text-banner-dark">
      <main className="flex-grow">
        {/* Header Section */}
        <section className="relative px-6 pt-12 pb-16 lg:px-8 bg-banner-light/5 border-b border-banner-light/20">
          <div className="max-w-7xl mx-auto">
            <Link href="/activities" className="inline-flex items-center space-x-2 text-banner-dark/70 hover:text-banner-dark font-medium mb-8 transition-colors group">
              <ArrowLeftIcon className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" />
              <span>Back to all activities</span>
            </Link>
            
            <h1 className="text-4xl md:text-5xl font-bold text-banner-dark tracking-tight mb-4">{album.title}</h1>
            
            {album.description && (
              <p className="text-xl text-banner-dark/80 max-w-3xl leading-relaxed mb-6">
                {album.description}
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-banner-dark/60 bg-white inline-flex px-4 py-2 rounded-full shadow-sm border border-banner-light/20">
              <div className="flex items-center">
                <PhotoIcon className="w-5 h-5 mr-2 text-banner-light" />
                <span>{media.length} {media.length === 1 ? 'item' : 'items'}</span>
              </div>
              <div className="flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2 text-banner-light" />
                <span>Created on {new Date(album.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          {media.length === 0 ? (
            <div className="text-center py-24 bg-banner-light/5 rounded-3xl border-2 border-dashed border-banner-light/30 flex flex-col items-center justify-center">
              <PhotoIcon className="w-16 h-16 text-banner-light mb-4 opacity-50" />
              <h3 className="text-2xl font-bold text-banner-dark">No media yet</h3>
              <p className="mt-2 text-banner-dark/60 text-lg">Photos and videos for this album will appear here.</p>
            </div>
          ) : (
            <PublicGallery media={media} />
          )}
        </div>
      </main>
    </div>
  )
}
