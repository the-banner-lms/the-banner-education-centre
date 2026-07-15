import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getUserProfile } from '@/utils/supabase/queries'
import { canRoleReadBook, hydrateBook } from '@/utils/books'
import type { TextbookRow } from '@/types/books'
import BookReaderLoader from '@/components/books/BookReaderLoader'

export const dynamic = 'force-dynamic'

export default async function ReadTextbookPage({ params }: PageProps<'/textbook/read/[id]'>) {
  const { id } = await params
  const supabase = await createClient()
  const profile = await getUserProfile(supabase)
  const { data, error } = await supabase
    .from('textbooks')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  const book = hydrateBook(data as TextbookRow)
  if (!book.metadata.isPublished || !book.metadata.pdfUrl || !canRoleReadBook(book.metadata, profile?.role)) {
    notFound()
  }

  return (
    <BookReaderLoader
      bookId={book.id}
      title={book.title}
      gradeLevel={book.grade_level || 'General'}
      pdfUrl={book.metadata.pdfUrl}
    />
  )
}
