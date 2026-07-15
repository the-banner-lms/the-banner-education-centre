import { BookOpenIcon } from '@heroicons/react/24/outline'
import { createClient } from '@/utils/supabase/server'
import { getUserProfile } from '@/utils/supabase/queries'
import { canRoleReadBook, hydrateBook, sortBooks } from '@/utils/books'
import type { TextbookRow } from '@/types/books'
import BookCoverLink from '@/components/books/BookCoverLink'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Bookshelf | The Banner Education Centre',
  description: 'Read The Banner Education Centre textbooks online.',
}

export default async function TextbookPage() {
  const supabase = await createClient()
  const [profile, { data, error }] = await Promise.all([
    getUserProfile(supabase),
    supabase
      .from('textbooks')
      .select('*')
      .order('created_at', { ascending: true }),
  ])

  const books = sortBooks(((data || []) as TextbookRow[]).map(hydrateBook))
    .filter(book => book.metadata.isPublished && canRoleReadBook(book.metadata, profile?.role))

  return (
    <div className="min-h-[calc(100vh-5rem)] overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(140,210,171,0.2),_transparent_42%)] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <header className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-banner-dark text-white shadow-lg shadow-green-900/15">
            <BookOpenIcon className="h-9 w-9" aria-hidden="true" />
          </div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-banner-dark/65">The Banner Library</p>
          <h1 className="text-4xl font-black tracking-tight text-banner-brown sm:text-5xl">Bookshelf</h1>
          <p className="mt-4 text-base leading-7 text-gray-600 sm:text-lg">
            Choose a book, turn the pages, and continue learning anywhere.
          </p>
        </header>

        {error ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
            The bookshelf could not be loaded. Please try again shortly.
          </div>
        ) : books.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-banner-light/30 bg-white/90 p-10 text-center shadow-sm">
            <BookOpenIcon className="mx-auto h-12 w-12 text-banner-dark/35" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-bold text-banner-brown">The shelf is being prepared</h2>
            <p className="mt-2 text-gray-600">Books added by the administrator will appear here.</p>
          </div>
        ) : (
          <div className="bookshelf-grid" aria-label="Available textbooks">
            {books.map(book => (
              <div key={book.id} className="book-shelf-slot">
                <BookCoverLink
                  id={book.id}
                  title={book.title}
                  gradeLevel={book.grade_level || 'General'}
                  coverUrl={book.cover_url}
                  isRestricted={!profile || !book.metadata.accessRoles.includes('all')}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
