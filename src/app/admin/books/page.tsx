import { createClient } from '@/utils/supabase/server'
import { hydrateBook, sortBooks } from '@/utils/books'
import type { TextbookRow } from '@/types/books'
import BookManager from '@/components/books/BookManager'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Manage Books | Admin',
}

export default async function AdminBooksPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('textbooks')
    .select('*')
    .order('created_at', { ascending: true })

  const books = sortBooks(((data || []) as TextbookRow[]).map(hydrateBook))

  return (
    <div className="mx-auto max-w-7xl">
      <BookManager books={books} loadError={error?.message || ''} />
    </div>
  )
}
