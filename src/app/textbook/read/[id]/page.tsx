import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { canRoleReadBook, hydrateBook } from '@/utils/books'
import type { TextbookRow } from '@/types/books'
import BookReaderLoader from '@/components/books/BookReaderLoader'

export const dynamic = 'force-dynamic'

export default async function ReadTextbookPage({ params }: PageProps<'/textbook/read/[id]'>) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/textbook/read/${id}`)}`)
  }

  const [{ data: profile }, { data, error }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('textbooks').select('*').eq('id', id).single(),
  ])

  if (error || !data) notFound()

  const book = hydrateBook(data as TextbookRow)
  if (!book.metadata.isPublished || !book.metadata.storagePath || !canRoleReadBook(book.metadata, profile?.role)) {
    notFound()
  }

  const { data: signedPdf, error: signedPdfError } = await supabaseAdmin.storage
    .from('textbook-pdfs')
    .createSignedUrl(book.metadata.storagePath, 60 * 60)

  if (signedPdfError || !signedPdf?.signedUrl) notFound()

  return (
    <BookReaderLoader
      bookId={book.id}
      title={book.title}
      gradeLevel={book.grade_level || 'General'}
      pdfUrl={signedPdf.signedUrl}
    />
  )
}
