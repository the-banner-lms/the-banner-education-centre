import Link from 'next/link'
import { getAlbums } from '@/app/actions/activitiesActions'
import { PhotoIcon } from '@heroicons/react/24/outline'

export const dynamic = 'force-dynamic';

export default async function ActivitiesPage() {
  const albums = await getAlbums()

  return (
    <div className="min-h-screen bg-white flex flex-col text-banner-dark">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative isolate px-6 pt-24 pb-24 lg:px-8 bg-banner-light/10 flex flex-col items-center justify-center">
          <div className="mx-auto max-w-4xl text-center z-10">
            <h1 className="text-4xl font-bold tracking-tight text-banner-dark sm:text-5xl lg:text-6xl mb-6">
              School Activities
            </h1>
            <p className="mt-4 text-xl leading-relaxed text-banner-dark/80 font-medium">
              A glimpse into the vibrant life at The Banner Education Centre. Explore our events, projects, and daily learning moments in nature.
            </p>
          </div>
          
          {/* Background Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-banner-light/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[30rem] h-[30rem] bg-banner-brown/10 rounded-full blur-3xl"></div>
          </div>
        </section>

        {/* Albums Grid */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
          {albums.length === 0 ? (
            <div className="text-center text-banner-dark/60 py-20 text-xl font-medium">
              Check back soon for new activities!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {albums.map((album) => (
                <Link key={album.id} href={`/activities/${album.id}`} className="group flex flex-col relative h-[400px] rounded-3xl overflow-hidden shadow-xl border-4 border-white transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
                  <div className="absolute inset-0 bg-banner-light/20">
                    {album.cover_image_url ? (
                      <img 
                        src={album.cover_image_url} 
                        alt={album.title} 
                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 ease-in-out"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-banner-dark">
                        <PhotoIcon className="w-20 h-20 opacity-30" />
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-banner-dark/90 via-banner-dark/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
                  
                  <div className="absolute bottom-0 left-0 w-full p-8 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <h3 className="text-3xl font-bold text-white mb-2 drop-shadow-md">{album.title}</h3>
                    {album.description && (
                      <p className="text-white/90 text-base line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 font-medium">
                        {album.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
