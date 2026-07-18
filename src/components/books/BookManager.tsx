'use client'

import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { pdfjs } from 'react-pdf'
import { Upload } from 'tus-js-client'
import {
  ArrowPathIcon,
  BookOpenIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { createClient } from '@/utils/supabase/client'
import { deleteBook, requestBookUpload, saveBook } from '@/app/actions/bookActions'
import {
  BOOK_ACCESS_ROLES,
  type BookAccessRole,
  type ManagedBook,
} from '@/types/books'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

const maximumPdfSize = 500 * 1024 * 1024
const maximumCoverSize = 5 * 1024 * 1024
const accessRoleLabels: Record<BookAccessRole, string> = {
  all: 'Everyone',
  student: 'Students',
  teacher: 'Teachers',
  staff: 'Staff',
  admin: 'Admins',
}

type FormValues = {
  title: string
  description: string
  gradeLevel: string
  orderIndex: number
  isPublished: boolean
  accessRoles: BookAccessRole[]
  removeCover: boolean
}

const emptyValues: FormValues = {
  title: '',
  description: '',
  gradeLevel: 'General',
  orderIndex: 0,
  isPublished: true,
  accessRoles: ['all'],
  removeCover: false,
}

function fileSizeLabel(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(bytes > 10 * 1024 * 1024 ? 0 : 1)} MB`
}

async function createCoverFromPdf(file: File) {
  const objectUrl = URL.createObjectURL(file)
  try {
    const pdf = await pdfjs.getDocument(objectUrl).promise
    const page = await pdf.getPage(1)
    const baseViewport = page.getViewport({ scale: 1 })
    const scale = Math.min(2, 620 / baseViewport.width)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) throw new Error('Unable to create the book cover.')

    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    await page.render({ canvas, canvasContext: context, viewport }).promise

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(result => result ? resolve(result) : reject(new Error('Unable to create the book cover.')), 'image/jpeg', 0.86)
    })
    page.cleanup()
    await pdf.destroy()
    return new File([blob], `${file.name.replace(/\.pdf$/i, '')}-cover.jpg`, { type: 'image/jpeg' })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export default function BookManager({ books, loadError }: { books: ManagedBook[]; loadError: string }) {
  const router = useRouter()
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [editingBook, setEditingBook] = useState<ManagedBook | null>(null)
  const [formValues, setFormValues] = useState<FormValues>(emptyValues)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const nextOrder = useMemo(
    () => books.reduce((maximum, book) => Math.max(maximum, book.metadata.orderIndex), -1) + 1,
    [books]
  )

  const openCreateForm = () => {
    setEditingBook(null)
    setFormValues({ ...emptyValues, orderIndex: nextOrder })
    setPdfFile(null)
    setCoverFile(null)
    setStatus('')
    setError('')
    setIsFormOpen(true)
  }

  const openEditForm = (book: ManagedBook) => {
    setEditingBook(book)
    setFormValues({
      title: book.title,
      description: book.metadata.description,
      gradeLevel: book.grade_level || 'General',
      orderIndex: book.metadata.orderIndex,
      isPublished: book.metadata.isPublished,
      accessRoles: book.metadata.accessRoles,
      removeCover: false,
    })
    setPdfFile(null)
    setCoverFile(null)
    setStatus('')
    setError('')
    setIsFormOpen(true)
  }

  const closeForm = () => {
    if (isSaving) return
    setIsFormOpen(false)
    setEditingBook(null)
    setPdfFile(null)
    setCoverFile(null)
  }

  const handlePdfChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    setError('')
    if (!file) return setPdfFile(null)
    if (file.type !== 'application/pdf') {
      setError('Please choose a PDF file.')
      event.target.value = ''
      return
    }
    if (file.size > maximumPdfSize) {
      setError('PDF must be 500 MB or smaller.')
      event.target.value = ''
      return
    }
    setPdfFile(file)
  }

  const handleCoverChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    setError('')
    if (!file) return setCoverFile(null)
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Cover must be a JPG, PNG, or WebP image.')
      event.target.value = ''
      return
    }
    if (file.size > maximumCoverSize) {
      setError('Cover image must be 5 MB or smaller.')
      event.target.value = ''
      return
    }
    setCoverFile(file)
    setFormValues(value => ({ ...value, removeCover: false }))
  }

  const toggleRole = (role: BookAccessRole) => {
    setFormValues(value => {
      if (role === 'all') return { ...value, accessRoles: ['all'] }

      const withoutAll = value.accessRoles.filter(item => item !== 'all')
      const nextRoles = withoutAll.includes(role)
        ? withoutAll.filter(item => item !== role)
        : [...withoutAll, role]
      return { ...value, accessRoles: nextRoles.length ? nextRoles : ['all'] }
    })
  }

  const uploadFile = async (file: File, kind: 'pdf' | 'cover') => {
    const signedUpload = await requestBookUpload(file.name, file.type, file.size, kind)
    const supabase = createClient()

    if (kind === 'pdf' && file.size > 6 * 1024 * 1024) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl) throw new Error('Supabase Storage is not configured.')
      const resumableEndpoint = `${supabaseUrl.replace('.supabase.co', '.storage.supabase.co')}/storage/v1/upload/resumable`

      await new Promise<void>((resolve, reject) => {
        const upload = new Upload(file, {
          endpoint: resumableEndpoint,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          headers: { 'x-signature': signedUpload.token },
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          metadata: {
            bucketName: signedUpload.bucket,
            objectName: signedUpload.path,
            contentType: file.type,
            cacheControl: '3600',
          },
          chunkSize: 6 * 1024 * 1024,
          onError: reject,
          onProgress: (bytesUploaded, bytesTotal) => {
            const percentage = Math.max(1, Math.round((bytesUploaded / bytesTotal) * 100))
            setStatus(`Uploading PDF (${fileSizeLabel(file.size)}) · ${percentage}%`)
          },
          onSuccess: () => resolve(),
        })

        void upload.findPreviousUploads().then(previousUploads => {
          if (previousUploads.length > 0) upload.resumeFromPreviousUpload(previousUploads[0])
          upload.start()
        }).catch(reject)
      })

      return signedUpload.path
    }

    const { error: uploadError } = await supabase.storage
      .from(signedUpload.bucket)
      .uploadToSignedUrl(signedUpload.path, signedUpload.token, file, {
        contentType: file.type,
        cacheControl: '3600',
      })

    if (uploadError) {
      console.error('Book upload failed:', uploadError)
      throw new Error(`Unable to upload ${kind === 'pdf' ? 'the PDF' : 'the cover image'}.`)
    }
    return signedUpload.path
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingBook && !pdfFile) {
      setError('Please choose a PDF file for the new book.')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      let pdfPath: string | null = null
      let coverPath: string | null = null

      if (pdfFile) {
        setStatus(`Uploading PDF (${fileSizeLabel(pdfFile.size)})…`)
        pdfPath = await uploadFile(pdfFile, 'pdf')
      }

      let finalCover = coverFile
      if (!finalCover && pdfFile && !formValues.removeCover) {
        setStatus('Creating cover from the first page…')
        finalCover = await createCoverFromPdf(pdfFile)
      }

      if (finalCover && !formValues.removeCover) {
        setStatus('Uploading cover…')
        coverPath = await uploadFile(finalCover, 'cover')
      }

      setStatus('Saving book details…')
      await saveBook({
        id: editingBook?.id,
        title: formValues.title,
        description: formValues.description,
        gradeLevel: formValues.gradeLevel,
        orderIndex: formValues.orderIndex,
        isPublished: formValues.isPublished,
        accessRoles: formValues.accessRoles,
        pdfPath,
        coverPath,
        originalFileName: pdfFile?.name || editingBook?.metadata.originalFileName,
        removeCover: formValues.removeCover,
      })

      setStatus('Saved successfully.')
      setIsFormOpen(false)
      setEditingBook(null)
      setPdfFile(null)
      setCoverFile(null)
      router.refresh()
    } catch (submissionError) {
      console.error('Unable to save book:', submissionError)
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to save the book.')
    } finally {
      setIsSaving(false)
      setStatus('')
    }
  }

  const handleDelete = async (book: ManagedBook) => {
    if (!window.confirm(`Delete “${book.title}” and its uploaded files? This cannot be undone.`)) return
    setDeletingId(book.id)
    setError('')
    try {
      await deleteBook(book.id)
      router.refresh()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete the book.')
    } finally {
      setDeletingId('')
    }
  }

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-banner-dark/60">Content Library</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-gray-900">Manage Books</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Add, replace, arrange, publish, and control who can read each flipbook.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex min-h-11 self-start items-center gap-2 rounded-xl bg-banner-dark px-5 py-2.5 font-bold text-white shadow-sm transition hover:bg-[#0b5427] sm:self-auto"
        >
          <PlusIcon className="h-5 w-5" />
          Add Book
        </button>
      </div>

      {(loadError || error) && (
        <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || `Unable to load books: ${loadError}`}
        </div>
      )}

      {books.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-banner-light bg-white p-12 text-center shadow-sm">
          <BookOpenIcon className="mx-auto h-14 w-14 text-banner-dark/30" />
          <h2 className="mt-4 text-xl font-bold text-gray-900">No books yet</h2>
          <p className="mt-2 text-gray-500">Add the first PDF to start your bookshelf.</p>
          <button type="button" onClick={openCreateForm} className="mt-5 rounded-lg bg-banner-dark px-4 py-2 font-bold text-white">
            Add First Book
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {books.map(book => (
            <article key={book.id} className="flex min-w-0 gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
              <div className="h-36 w-24 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-banner-dark to-green-950 shadow">
                {book.cover_url ? (
                  <img src={book.cover_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <BookOpenIcon className="h-full w-full p-6 text-banner-light" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="line-clamp-2 font-bold leading-tight text-gray-900">{book.title}</h2>
                    <p className="mt-1 truncate text-xs font-semibold text-banner-dark">{book.grade_level || 'General'}</p>
                  </div>
                  {book.metadata.isPublished ? (
                    <span title="Published" className="shrink-0 rounded-full bg-green-50 p-1.5 text-green-700"><EyeIcon className="h-4 w-4" /></span>
                  ) : (
                    <span title="Hidden" className="shrink-0 rounded-full bg-gray-100 p-1.5 text-gray-500"><EyeSlashIcon className="h-4 w-4" /></span>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-500">
                  {book.metadata.description || 'No description'}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Order {book.metadata.orderIndex} · {book.metadata.accessRoles.map(role => accessRoleLabels[role]).join(', ')}
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-3">
                  <Link href={`/textbook/read/${book.id}`} className="rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-bold text-banner-dark hover:bg-green-100">
                    Open
                  </Link>
                  <button type="button" onClick={() => openEditForm(book)} className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100">
                    <PencilSquareIcon className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(book)}
                    disabled={deletingId === book.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    {deletingId === book.id ? <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" /> : <TrashIcon className="h-3.5 w-3.5" />}
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-gray-950/55 p-0 backdrop-blur-sm sm:p-5" role="dialog" aria-modal="true" aria-labelledby="book-form-title">
          <div className="mx-auto min-h-full max-w-3xl bg-white sm:min-h-0 sm:rounded-3xl sm:shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/95 px-5 py-4 backdrop-blur sm:rounded-t-3xl sm:px-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-banner-dark/60">Bookshelf</p>
                <h2 id="book-form-title" className="text-xl font-black text-gray-900">{editingBook ? 'Edit Book' : 'Add New Book'}</h2>
              </div>
              <button type="button" onClick={closeForm} disabled={isSaving} className="rounded-full p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40" aria-label="Close">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="text-sm font-bold text-gray-700">Book Title</span>
                  <input required value={formValues.title} onChange={event => setFormValues(value => ({ ...value, title: event.target.value }))} className="mt-1.5 block w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-banner-dark focus:ring-2 focus:ring-banner-light/30" />
                </label>

                <label>
                  <span className="text-sm font-bold text-gray-700">Grade / Category</span>
                  <input value={formValues.gradeLevel} onChange={event => setFormValues(value => ({ ...value, gradeLevel: event.target.value }))} className="mt-1.5 block w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-banner-dark focus:ring-2 focus:ring-banner-light/30" />
                </label>

                <label>
                  <span className="text-sm font-bold text-gray-700">Display Order</span>
                  <input type="number" min="0" max="9999" value={formValues.orderIndex} onChange={event => setFormValues(value => ({ ...value, orderIndex: Number(event.target.value) || 0 }))} className="mt-1.5 block w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-banner-dark focus:ring-2 focus:ring-banner-light/30" />
                </label>

                <label className="sm:col-span-2">
                  <span className="text-sm font-bold text-gray-700">Description</span>
                  <textarea rows={3} value={formValues.description} onChange={event => setFormValues(value => ({ ...value, description: event.target.value }))} className="mt-1.5 block w-full resize-y rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-banner-dark focus:ring-2 focus:ring-banner-light/30" />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <span className="text-sm font-bold text-gray-800">PDF File</span>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    {editingBook ? 'Choose a PDF only when replacing the current book.' : 'Required. Maximum 500 MB.'}
                  </p>
                  <button type="button" onClick={() => pdfInputRef.current?.click()} disabled={isSaving} className="mt-3 rounded-lg bg-banner-dark px-3 py-2 text-sm font-bold text-white disabled:opacity-50">
                    {pdfFile ? 'Choose Another PDF' : editingBook ? 'Replace PDF' : 'Choose PDF'}
                  </button>
                  <input ref={pdfInputRef} type="file" accept="application/pdf,.pdf" onChange={handlePdfChange} className="sr-only" />
                  {pdfFile ? (
                    <p className="mt-2 break-all text-xs font-semibold text-indigo-700">{pdfFile.name} · {fileSizeLabel(pdfFile.size)}</p>
                  ) : editingBook?.metadata.originalFileName ? (
                    <p className="mt-2 break-all text-xs text-gray-500">Current: {editingBook.metadata.originalFileName}</p>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <span className="text-sm font-bold text-gray-800">Book Cover</span>
                  <p className="mt-1 text-xs leading-5 text-gray-500">Optional. If omitted, the PDF first page becomes the cover.</p>
                  <button type="button" onClick={() => coverInputRef.current?.click()} disabled={isSaving} className="mt-3 rounded-lg border border-banner-dark px-3 py-2 text-sm font-bold text-banner-dark disabled:opacity-50">
                    {coverFile ? 'Choose Another Cover' : 'Choose Cover'}
                  </button>
                  <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverChange} className="sr-only" />
                  {coverFile && <p className="mt-2 break-all text-xs font-semibold text-indigo-700">{coverFile.name}</p>}
                  {editingBook?.cover_url && !coverFile && (
                    <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-red-700">
                      <input type="checkbox" checked={formValues.removeCover} onChange={event => setFormValues(value => ({ ...value, removeCover: event.target.checked }))} className="h-4 w-4 rounded border-gray-300" />
                      Remove current cover
                    </label>
                  )}
                </div>
              </div>

              <fieldset>
                <legend className="text-sm font-bold text-gray-800">Who can read this book?</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {BOOK_ACCESS_ROLES.map(role => {
                    const selected = formValues.accessRoles.includes(role)
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRole(role)}
                        aria-pressed={selected}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-bold transition ${selected ? 'border-banner-dark bg-banner-dark text-white' : 'border-gray-300 bg-white text-gray-600 hover:border-banner-light'}`}
                      >
                        {selected && <CheckCircleIcon className="h-4 w-4" />}
                        {accessRoleLabels[role]}
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <label className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
                <input type="checkbox" checked={formValues.isPublished} onChange={event => setFormValues(value => ({ ...value, isPublished: event.target.checked }))} className="mt-0.5 h-5 w-5 rounded border-gray-300 text-banner-dark" />
                <span>
                  <span className="block text-sm font-bold text-green-900">Published</span>
                  <span className="block text-xs leading-5 text-green-800/70">Show this book on the Bookshelf to the selected readers.</span>
                </span>
              </label>

              {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
              {status && <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">{status}</p>}

              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeForm} disabled={isSaving} className="rounded-xl border border-gray-300 px-5 py-2.5 font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-banner-dark px-5 py-2.5 font-bold text-white shadow-sm hover:bg-[#0b5427] disabled:opacity-50">
                  {isSaving && <ArrowPathIcon className="h-5 w-5 animate-spin" />}
                  {isSaving ? 'Saving…' : editingBook ? 'Save Changes' : 'Add to Bookshelf'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
