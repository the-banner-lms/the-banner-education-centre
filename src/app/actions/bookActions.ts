'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { hydrateBook, serializeBookMetadata } from '@/utils/books'
import {
  BOOK_ACCESS_ROLES,
  type BookAccessRole,
  type SaveBookInput,
  type TextbookRow,
} from '@/types/books'

const bucketName = 'textbooks'
const maximumPdfSize = 50 * 1024 * 1024
const maximumCoverSize = 5 * 1024 * 1024

async function verifyAdminAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Please sign in again.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Only administrators can manage books.')
  }
}

function cleanText(value: unknown, maximumLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maximumLength) : ''
}

function normalizeRoles(value: BookAccessRole[]) {
  const roles = Array.isArray(value)
    ? value.filter(role => BOOK_ACCESS_ROLES.includes(role))
    : []

  if (roles.includes('all') || roles.length === 0) return ['all'] as BookAccessRole[]
  return Array.from(new Set(roles))
}

function getPublicUrl(path: string) {
  return supabaseAdmin.storage.from(bucketName).getPublicUrl(path).data.publicUrl
}

async function hasStructuredBookColumns() {
  const { error } = await supabaseAdmin.from('textbooks').select('pdf_url').limit(1)
  return !error
}

function revalidateBookPages(id?: string) {
  revalidatePath('/textbook')
  revalidatePath('/admin/books')
  if (id) revalidatePath(`/textbook/read/${id}`)
}

export async function requestBookUpload(
  fileName: string,
  mimeType: string,
  fileSize: number,
  kind: 'pdf' | 'cover'
) {
  await verifyAdminAccess()

  const isPdf = kind === 'pdf'
  const allowedCoverTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

  if (isPdf && mimeType !== 'application/pdf') {
    throw new Error('Please choose a PDF file.')
  }
  if (!isPdf && !allowedCoverTypes.has(mimeType)) {
    throw new Error('Cover must be a JPG, PNG, or WebP image.')
  }

  const maximumSize = isPdf ? maximumPdfSize : maximumCoverSize
  if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > maximumSize) {
    throw new Error(isPdf ? 'PDF must be 50 MB or smaller.' : 'Cover image must be 5 MB or smaller.')
  }

  const safeExtension = isPdf
    ? 'pdf'
    : mimeType === 'image/png'
      ? 'png'
      : mimeType === 'image/webp'
        ? 'webp'
        : 'jpg'
  const safeName = cleanText(fileName.replace(/\.[^.]+$/, ''), 70)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || kind
  const path = `books/${crypto.randomUUID()}/${safeName}.${safeExtension}`

  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .createSignedUploadUrl(path)

  if (error || !data?.token) {
    console.error('Unable to create signed book upload:', error)
    throw new Error('Unable to start the upload. Please try again.')
  }

  return { path, token: data.token }
}

export async function saveBook(input: SaveBookInput) {
  await verifyAdminAccess()

  const title = cleanText(input.title, 180)
  if (!title) throw new Error('Book title is required.')

  const description = cleanText(input.description, 2000)
  const gradeLevel = cleanText(input.gradeLevel, 80) || 'General'
  const orderIndex = Number.isFinite(input.orderIndex)
    ? Math.max(0, Math.min(9999, Math.trunc(input.orderIndex)))
    : 0
  const accessRoles = normalizeRoles(input.accessRoles)

  let existing: ReturnType<typeof hydrateBook> | null = null
  if (input.id) {
    const { data, error } = await supabaseAdmin
      .from('textbooks')
      .select('*')
      .eq('id', input.id)
      .single()

    if (error || !data) throw new Error('Book not found.')
    existing = hydrateBook(data as TextbookRow)
  }

  const pdfPath = input.pdfPath || existing?.metadata.storagePath || null
  const pdfUrl = input.pdfPath
    ? getPublicUrl(input.pdfPath)
    : existing?.metadata.pdfUrl || ''
  if (!pdfPath || !pdfUrl) throw new Error('A PDF file is required.')

  const coverPath = input.removeCover
    ? null
    : input.coverPath || existing?.metadata.coverStoragePath || null
  const coverUrl = input.removeCover
    ? null
    : input.coverPath
      ? getPublicUrl(input.coverPath)
      : existing?.cover_url || null

  const metadata = {
    version: 1 as const,
    description,
    pdfUrl,
    storagePath: pdfPath,
    coverStoragePath: coverPath,
    originalFileName: cleanText(input.originalFileName, 220) || existing?.metadata.originalFileName || null,
    orderIndex,
    isPublished: Boolean(input.isPublished),
    accessRoles,
  }

  const baseRow = {
    title,
    description,
    cover_url: coverUrl,
    grade_level: gradeLevel,
  }

  const row = await hasStructuredBookColumns()
    ? {
        ...baseRow,
        pdf_url: metadata.pdfUrl,
        storage_path: metadata.storagePath,
        cover_storage_path: metadata.coverStoragePath,
        original_file_name: metadata.originalFileName,
        order_index: metadata.orderIndex,
        is_published: metadata.isPublished,
        access_roles: metadata.accessRoles,
      }
    : {
        ...baseRow,
        description: serializeBookMetadata(metadata),
      }

  let savedId = input.id
  if (input.id) {
    const { error } = await supabaseAdmin.from('textbooks').update(row).eq('id', input.id)
    if (error) {
      console.error('Unable to update book:', error)
      throw new Error('Failed to update the book.')
    }
  } else {
    const { data, error } = await supabaseAdmin
      .from('textbooks')
      .insert(row)
      .select('id')
      .single()

    if (error || !data) {
      console.error('Unable to create book:', error)
      throw new Error('Failed to create the book.')
    }
    savedId = data.id
  }

  const stalePaths = [
    input.pdfPath && existing?.metadata.storagePath !== input.pdfPath
      ? existing?.metadata.storagePath
      : null,
    (input.coverPath || input.removeCover) && existing?.metadata.coverStoragePath !== coverPath
      ? existing?.metadata.coverStoragePath
      : null,
  ].filter((path): path is string => Boolean(path))

  if (stalePaths.length > 0) {
    const { error } = await supabaseAdmin.storage.from(bucketName).remove(stalePaths)
    if (error) console.error('Unable to remove replaced book files:', error)
  }

  revalidateBookPages(savedId)
  return { id: savedId as string }
}

export async function deleteBook(id: string) {
  await verifyAdminAccess()

  const { data, error: fetchError } = await supabaseAdmin
    .from('textbooks')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !data) throw new Error('Book not found.')
  const book = hydrateBook(data as TextbookRow)

  const { error } = await supabaseAdmin.from('textbooks').delete().eq('id', id)
  if (error) throw new Error('Failed to delete the book.')

  const paths = [book.metadata.storagePath, book.metadata.coverStoragePath]
    .filter((path): path is string => Boolean(path))
  if (paths.length > 0) {
    const { error: storageError } = await supabaseAdmin.storage.from(bucketName).remove(paths)
    if (storageError) console.error('Unable to remove deleted book files:', storageError)
  }

  revalidateBookPages(id)
  return { success: true }
}
