export const BOOK_ACCESS_ROLES = ['all', 'student', 'teacher', 'staff', 'admin'] as const

export type BookAccessRole = (typeof BOOK_ACCESS_ROLES)[number]

export type BookMetadata = {
  version: 1
  description: string
  pdfUrl: string
  storagePath: string | null
  coverStoragePath: string | null
  originalFileName: string | null
  orderIndex: number
  isPublished: boolean
  accessRoles: BookAccessRole[]
}

export type TextbookRow = {
  id: string
  title: string
  description: string | null
  cover_url: string | null
  grade_level: string | null
  pdf_url?: string | null
  storage_path?: string | null
  cover_storage_path?: string | null
  original_file_name?: string | null
  order_index?: number | null
  is_published?: boolean | null
  access_roles?: string[] | null
  created_at: string
}

export type ManagedBook = TextbookRow & {
  metadata: BookMetadata
}

export type SaveBookInput = {
  id?: string
  title: string
  description: string
  gradeLevel: string
  orderIndex: number
  isPublished: boolean
  accessRoles: BookAccessRole[]
  pdfPath?: string | null
  coverPath?: string | null
  originalFileName?: string | null
  removeCover?: boolean
}
