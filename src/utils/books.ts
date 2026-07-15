import {
  BOOK_ACCESS_ROLES,
  type BookAccessRole,
  type BookMetadata,
  type ManagedBook,
  type TextbookRow,
} from '@/types/books'

const metadataMarker = 'banner-book-v1'

type StoredBookMetadata = Partial<BookMetadata> & {
  kind?: string
}

function normalizeRoles(value: unknown): BookAccessRole[] {
  if (!Array.isArray(value)) return ['all']

  const roles = value.filter((role): role is BookAccessRole =>
    typeof role === 'string' && BOOK_ACCESS_ROLES.includes(role as BookAccessRole)
  )

  if (roles.includes('all') || roles.length === 0) return ['all']
  return Array.from(new Set(roles))
}

export function parseBookMetadata(value: string | null | undefined): BookMetadata {
  const fallback: BookMetadata = {
    version: 1,
    description: value || '',
    pdfUrl: '',
    storagePath: null,
    coverStoragePath: null,
    originalFileName: null,
    orderIndex: 0,
    isPublished: true,
    accessRoles: ['all'],
  }

  if (!value?.trim().startsWith('{')) return fallback

  try {
    const stored = JSON.parse(value) as StoredBookMetadata
    if (stored.kind !== metadataMarker) return fallback

    return {
      version: 1,
      description: typeof stored.description === 'string' ? stored.description : '',
      pdfUrl: typeof stored.pdfUrl === 'string' ? stored.pdfUrl : '',
      storagePath: typeof stored.storagePath === 'string' ? stored.storagePath : null,
      coverStoragePath: typeof stored.coverStoragePath === 'string' ? stored.coverStoragePath : null,
      originalFileName: typeof stored.originalFileName === 'string' ? stored.originalFileName : null,
      orderIndex: Number.isFinite(stored.orderIndex) ? Number(stored.orderIndex) : 0,
      isPublished: stored.isPublished !== false,
      accessRoles: normalizeRoles(stored.accessRoles),
    }
  } catch {
    return fallback
  }
}

export function serializeBookMetadata(metadata: BookMetadata) {
  return JSON.stringify({ kind: metadataMarker, ...metadata })
}

export function hydrateBook(row: TextbookRow): ManagedBook {
  const legacy = parseBookMetadata(row.description)
  const hasStructuredColumns = row.pdf_url !== undefined

  return {
    ...row,
    metadata: hasStructuredColumns
      ? {
          version: 1,
          description: legacy.pdfUrl ? legacy.description : row.description || '',
          pdfUrl: row.pdf_url || legacy.pdfUrl,
          storagePath: row.storage_path || legacy.storagePath,
          coverStoragePath: row.cover_storage_path || legacy.coverStoragePath,
          originalFileName: row.original_file_name || legacy.originalFileName,
          orderIndex: Number.isFinite(row.order_index) ? Number(row.order_index) : legacy.orderIndex,
          isPublished: row.is_published !== false,
          accessRoles: normalizeRoles(row.access_roles || legacy.accessRoles),
        }
      : legacy,
  }
}

export function sortBooks(books: ManagedBook[]) {
  return [...books].sort((a, b) => {
    const orderDifference = a.metadata.orderIndex - b.metadata.orderIndex
    if (orderDifference !== 0) return orderDifference
    return a.created_at.localeCompare(b.created_at)
  })
}

export function canRoleReadBook(metadata: BookMetadata, role?: string | null) {
  if (metadata.accessRoles.includes('all')) return true
  if (!role) return false
  return metadata.accessRoles.includes(role as BookAccessRole)
}
