import { BookOpenIcon } from '@heroicons/react/24/outline'

export default function LoadingBookshelf() {
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[radial-gradient(circle_at_top,_rgba(140,210,171,0.2),_transparent_42%)] px-4 py-10 sm:px-6 sm:py-14 lg:px-8" role="status" aria-live="polite">
      <section className="mx-auto max-w-7xl">
        <header className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-banner-dark text-white shadow-lg">
            <BookOpenIcon className="h-9 w-9 animate-pulse" aria-hidden="true" />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-banner-dark/65">The Banner Library</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-banner-brown sm:text-5xl">Bookshelf</h1>
          <p className="mt-4 text-gray-500">Loading your books…</p>
        </header>

        <div className="bookshelf-grid" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="book-shelf-slot">
              <div className="w-full max-w-44 animate-pulse">
                <div className="aspect-[0.72] rounded-lg bg-banner-light/20 shadow-sm" />
                <div className="mx-auto mt-3 h-4 w-4/5 rounded bg-banner-light/20" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
