'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
  startTransition,
} from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import Link, { useLinkStatus } from 'next/link'
import { useRouter } from 'next/navigation'
import { PageFlip } from 'page-flip'
import { Document, Page, pdfjs } from 'react-pdf'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import {
  ArrowsPointingOutIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

const BOOK_PAGE_ASPECT_RATIO = 1.414
const MOBILE_PAGE_WINDOW_SIZE = 7
const DESKTOP_PAGE_WINDOW_SIZE = 10

function getPageWindowStart(targetIndex: number, totalPages: number, isMobile: boolean) {
  const requestedSize = isMobile ? MOBILE_PAGE_WINDOW_SIZE : DESKTOP_PAGE_WINDOW_SIZE
  const windowSize = Math.min(totalPages, requestedSize)
  const maxStart = Math.max(0, totalPages - windowSize)
  let start = Math.max(0, Math.min(maxStart, targetIndex - Math.floor(windowSize / 2)))

  if (!isMobile) {
    start = Math.min(maxStart, Math.max(0, Math.floor(start / 2) * 2))
    if (start % 2 !== 0) start = Math.max(0, start - 1)
  }

  return start
}

export type FlipbookReaderProps = {
  bookId: string
  title: string
  gradeLevel: string
  pdfUrl: string
  coverUrl: string | null
}

type PdfBookPageContentProps = {
  pageNumber: number
  pageWidth: number
  devicePixelRatio: number
  shouldRender: boolean
  onFirstPageRendered: () => void
}

const PdfBookPageContent = memo(function PdfBookPageContent({
  pageNumber,
  pageWidth,
  devicePixelRatio,
  shouldRender,
  onFirstPageRendered,
}: PdfBookPageContentProps) {
  return (
    <div className="flipbook-page-paper">
      {shouldRender ? (
        <Page
          pageNumber={pageNumber}
          width={pageWidth}
          devicePixelRatio={devicePixelRatio}
          renderAnnotationLayer={false}
          renderTextLayer={false}
          onRenderSuccess={onFirstPageRendered}
          loading={<PagePlaceholder pageNumber={pageNumber} />}
        />
      ) : (
        <PagePlaceholder pageNumber={pageNumber} />
      )}
      <span className="flipbook-page-number">{pageNumber}</span>
    </div>
  )
})

type PortalPageTarget = {
  pageNumber: number
  element: HTMLDivElement
}

function RealPageFlipWindow({
  pageNumbers,
  windowStart,
  currentPageIndex,
  renderPageIndex,
  pageWidth,
  pageHeight,
  bookWidth,
  devicePixelRatio,
  onFirstPageRendered,
  onFlip,
  onReady,
  onInstanceChange,
}: {
  pageNumbers: number[]
  windowStart: number
  currentPageIndex: number
  renderPageIndex: number
  pageWidth: number
  pageHeight: number
  bookWidth: number
  devicePixelRatio: number
  onFirstPageRendered: () => void
  onFlip: (localIndex: number) => void
  onReady: () => void
  onInstanceChange: (instance: PageFlip | null) => void
}) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const bookElementRef = useRef<HTMLDivElement | null>(null)
  const initialPageIndexRef = useRef(currentPageIndex)
  const [portalTargets, setPortalTargets] = useState<PortalPageTarget[]>([])

  useEffect(() => {
    const host = hostRef.current
    if (!host || pageNumbers.length === 0) return

    const bookElement = document.createElement('div')
    bookElement.className = 'banner-flipbook'
    bookElement.style.width = `${bookWidth}px`
    bookElement.style.height = `${pageHeight}px`
    bookElement.style.margin = '0 auto'
    bookElement.dataset.windowStart = String(windowStart)

    const targets = pageNumbers.map(pageNumber => {
      const element = document.createElement('div')
      element.className = 'flipbook-page'
      element.dataset.density = 'soft'
      element.dataset.pageNumber = String(pageNumber)
      bookElement.appendChild(element)
      return { pageNumber, element }
    })

    host.replaceChildren(bookElement)
    bookElementRef.current = bookElement
    setPortalTargets(targets)

    return () => {
      bookElementRef.current = null
      bookElement.remove()
    }
  }, [bookWidth, pageHeight, pageNumbers, windowStart])

  useEffect(() => {
    const bookElement = bookElementRef.current
    if (!bookElement || portalTargets.length !== pageNumbers.length) return

    const startPage = Math.max(
      0,
      Math.min(pageNumbers.length - 1, initialPageIndexRef.current - windowStart)
    )
    let acceptFlipEvents = false
    let readyTimer = 0
    const pageFlip = new PageFlip(bookElement, {
      width: pageWidth,
      height: pageHeight,
      size: 'fixed',
      startPage,
      drawShadow: true,
      flippingTime: 520,
      usePortrait: true,
      startZIndex: 0,
      autoSize: false,
      maxShadowOpacity: 0.48,
      showCover: windowStart === 0,
      mobileScrollSupport: true,
      clickEventForward: true,
      useMouseEvents: true,
      swipeDistance: 24,
      showPageCorners: true,
      disableFlipByClick: false,
    })

    pageFlip.on('flip', event => {
      const localIndex = Number(event.data)
      if (!acceptFlipEvents) return
      onFlip(localIndex)
    })
    pageFlip.on('init', () => {
      readyTimer = window.setTimeout(() => {
        acceptFlipEvents = true
        onReady()
      }, 240)
    })
    pageFlip.loadFromHTML(portalTargets.map(target => target.element))
    onInstanceChange(pageFlip)

    return () => {
      pageFlip.off('flip')
      pageFlip.off('init')
      if (readyTimer) window.clearTimeout(readyTimer)
      onInstanceChange(null)
      try {
        pageFlip.destroy()
      } catch {
        bookElement.remove()
      }
    }
  }, [onFlip, onInstanceChange, onReady, pageHeight, pageNumbers.length, pageWidth, portalTargets, windowStart])

  return (
    <>
      <div
        ref={hostRef}
        className="flipbook-engine-host"
        style={{ width: bookWidth, height: pageHeight, margin: '0 auto' }}
      />
      {portalTargets.map(({ pageNumber, element }) => createPortal(
        <PdfBookPageContent
          pageNumber={pageNumber}
          pageWidth={pageWidth}
          devicePixelRatio={devicePixelRatio}
          shouldRender={Math.abs(pageNumber - 1 - renderPageIndex) <= 3}
          onFirstPageRendered={onFirstPageRendered}
        />,
        element,
        pageNumber
      ))}
    </>
  )
}

function BookLoadingPreview({
  coverUrl,
  message,
}: {
  coverUrl: string | null
  message: string
}) {
  return (
    <div className="flipbook-loading-preview" role="status">
      <div className="flipbook-loading-book" aria-hidden="true">
        <div className="flipbook-loading-page flipbook-loading-cover">
          {coverUrl ? (
            // The public cover is intentionally loaded directly while the private PDF initializes.
            <img src={coverUrl} alt="" loading="eager" fetchPriority="high" />
          ) : (
            <div className="flipbook-loading-cover-placeholder">
              <span>{message}</span>
            </div>
          )}
        </div>
        <div className="flipbook-loading-page flipbook-loading-paper">
          <span className="flipbook-loading-line flipbook-loading-line-wide" />
          <span className="flipbook-loading-line" />
          <span className="flipbook-loading-line flipbook-loading-line-short" />
        </div>
      </div>
      <div className="flipbook-loading-status">
        <span className="flipbook-loading-spinner" aria-hidden="true" />
        <span>{message}</span>
      </div>
    </div>
  )
}

function PagePlaceholder({ pageNumber }: { pageNumber: number }) {
  return (
    <div className="flex h-full min-h-72 w-full items-center justify-center bg-[#fffef9] text-sm font-semibold text-gray-300">
      Page {pageNumber}
    </div>
  )
}

function CloseReaderLinkContent() {
  const { pending } = useLinkStatus()

  return (
    <>
      <XMarkIcon className={`h-5 w-5 ${pending ? 'animate-pulse' : ''}`} aria-hidden="true" focusable="false" />
      <span className="hidden sm:inline">{pending ? 'Closing…' : 'Close'}</span>
    </>
  )
}

export default function FlipbookReader({
  bookId,
  title,
  gradeLevel,
  pdfUrl,
  coverUrl,
}: FlipbookReaderProps) {
  const router = useRouter()
  const bookRef = useRef<PageFlip | null>(null)
  const readerRef = useRef<HTMLDivElement | null>(null)
  const pendingPageTurnFrameRef = useRef<number | null>(null)
  const pendingPageTurnButtonRef = useRef<HTMLButtonElement | null>(null)
  const pendingPageRenderTimerRef = useRef<number | null>(null)
  const pendingWindowTimerRef = useRef<number | null>(null)
  const currentPageIndexRef = useRef(0)
  const [numPages, setNumPages] = useState(0)
  const [canLoadDocument, setCanLoadDocument] = useState(false)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [renderPageIndex, setRenderPageIndex] = useState(0)
  const [pageWindowStart, setPageWindowStart] = useState(0)
  const [pageInput, setPageInput] = useState('1')
  const [zoom, setZoom] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isBookReady, setIsBookReady] = useState(false)
  const [isFirstPageRendered, setIsFirstPageRendered] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [viewportSize, setViewportSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))
  const storageKey = `banner-book-progress:${bookId}`

  const viewportWidth = viewportSize.width
  const viewportHeight = viewportSize.height
  const isMobile = viewportWidth < 640
  const widthLimitedPageWidth = isMobile
    ? viewportWidth - 28
    : Math.floor((viewportWidth - 128) / 2)
  const heightLimitedPageWidth = Math.floor(
    Math.max(250, viewportHeight - (isMobile ? 250 : 170)) / BOOK_PAGE_ASPECT_RATIO
  )
  const pageWidth = Math.max(
    180,
    Math.min(isMobile ? 360 : 650, widthLimitedPageWidth, heightLimitedPageWidth)
  )
  const pageHeight = Math.round(pageWidth * BOOK_PAGE_ASPECT_RATIO)
  const bookWidth = isMobile ? pageWidth : pageWidth * 2
  const devicePixelRatio = isMobile
    ? Math.min(window.devicePixelRatio || 1, 1.35)
    : Math.min(window.devicePixelRatio || 1, 2)
  const documentOptions = useMemo(
    () => isMobile
      ? { disableAutoFetch: true, disableStream: true, rangeChunkSize: 256 * 1024 }
      : { rangeChunkSize: 256 * 1024 },
    [isMobile]
  )
  const windowPages = useMemo(() => {
    const windowSize = isMobile ? MOBILE_PAGE_WINDOW_SIZE : DESKTOP_PAGE_WINDOW_SIZE
    const end = Math.min(numPages, pageWindowStart + windowSize)
    return Array.from(
      { length: Math.max(0, end - pageWindowStart) },
      (_, index) => pageWindowStart + index + 1
    )
  }, [isMobile, numPages, pageWindowStart])

  const stageStyle = {
    '--flipbook-book-width': `${bookWidth}px`,
    '--flipbook-book-height': `${pageHeight}px`,
    '--flipbook-page-width': `${pageWidth}px`,
  } as CSSProperties

  useEffect(() => {
    const updateViewportSize = () => setViewportSize({
      width: window.innerWidth,
      height: window.innerHeight,
    })
    updateViewportSize()
    window.addEventListener('resize', updateViewportSize, { passive: true })
    return () => window.removeEventListener('resize', updateViewportSize)
  }, [])

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow
    const previousRootOverflow = document.documentElement.style.overflow
    const previousOverscrollBehavior = document.body.style.overscrollBehavior
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.fullscreenElement) {
        router.push('/textbook')
      }
    }
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousRootOverflow
      document.body.style.overscrollBehavior = previousOverscrollBehavior
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [router])

  useEffect(() => {
    let secondFrame = 0
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => setCanLoadDocument(true))
    })

    return () => {
      window.cancelAnimationFrame(firstFrame)
      if (secondFrame) window.cancelAnimationFrame(secondFrame)
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(document.fullscreenElement === readerRef.current)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => () => {
    if (pendingPageTurnFrameRef.current !== null) {
      window.cancelAnimationFrame(pendingPageTurnFrameRef.current)
    }
    if (pendingPageRenderTimerRef.current !== null) {
      window.clearTimeout(pendingPageRenderTimerRef.current)
    }
    if (pendingWindowTimerRef.current !== null) {
      window.clearTimeout(pendingWindowTimerRef.current)
    }
    if (pendingPageTurnButtonRef.current) {
      delete pendingPageTurnButtonRef.current.dataset.turning
      pendingPageTurnButtonRef.current.removeAttribute('aria-busy')
    }
  }, [])

  const onDocumentLoadSuccess = useCallback((pdf: PDFDocumentProxy) => {
    setLoadError('')
    setIsFirstPageRendered(false)
    const savedPage = Number.parseInt(localStorage.getItem(storageKey) || '1', 10)
    const targetIndex = Number.isFinite(savedPage)
      ? Math.max(0, Math.min(pdf.numPages - 1, savedPage - 1))
      : 0
    currentPageIndexRef.current = targetIndex
    setCurrentPageIndex(targetIndex)
    setRenderPageIndex(targetIndex)
    setPageWindowStart(getPageWindowStart(targetIndex, pdf.numPages, isMobile))
    setPageInput(String(targetIndex + 1))
    setNumPages(pdf.numPages)
    setIsBookReady(false)
  }, [isMobile, storageKey])

  const onFirstPageRendered = useCallback(() => setIsFirstPageRendered(true), [])

  const updateCurrentPage = useCallback((index: number) => {
    const safeIndex = Math.max(0, Math.min(numPages - 1, index))
    currentPageIndexRef.current = safeIndex
    setCurrentPageIndex(safeIndex)
    setPageInput(String(safeIndex + 1))

    if (pendingPageRenderTimerRef.current !== null) {
      window.clearTimeout(pendingPageRenderTimerRef.current)
    }
    pendingPageRenderTimerRef.current = window.setTimeout(() => {
      pendingPageRenderTimerRef.current = null
      startTransition(() => {
        setRenderPageIndex(safeIndex)
      })
      localStorage.setItem(storageKey, String(safeIndex + 1))
    }, 140)
  }, [numPages, storageKey])

  const goToPage = () => {
    if (!numPages) return
    const requestedPage = Number.parseInt(pageInput, 10)
    if (!Number.isFinite(requestedPage)) {
      setPageInput(String(currentPageIndex + 1))
      return
    }
    const targetIndex = Math.max(0, Math.min(numPages - 1, requestedPage - 1))
    updateCurrentPage(targetIndex)
    const nextWindowStart = getPageWindowStart(targetIndex, numPages, isMobile)
    if (nextWindowStart !== pageWindowStart) {
      setIsBookReady(false)
      setPageWindowStart(nextWindowStart)
    } else {
      bookRef.current?.turnToPage(targetIndex - pageWindowStart)
    }
  }

  const handleEngineFlip = useCallback((localIndex: number) => {
    const logicalIndex = pageWindowStart + localIndex
    updateCurrentPage(logicalIndex)

    const edgeBuffer = isMobile ? 2 : 3
    const nearStart = localIndex <= 1
    const nearEnd = localIndex >= windowPages.length - edgeBuffer
    if (!nearStart && !nearEnd) return

    const nextWindowStart = getPageWindowStart(logicalIndex, numPages, isMobile)
    if (nextWindowStart === pageWindowStart) return

    if (pendingWindowTimerRef.current !== null) {
      window.clearTimeout(pendingWindowTimerRef.current)
    }
    pendingWindowTimerRef.current = window.setTimeout(() => {
      pendingWindowTimerRef.current = null
      setIsBookReady(false)
      setPageWindowStart(nextWindowStart)
    }, 560)
  }, [isMobile, numPages, pageWindowStart, updateCurrentPage, windowPages.length])

  const handleBookReady = useCallback(() => setIsBookReady(true), [])
  const handleBookInstanceChange = useCallback((instance: PageFlip | null) => {
    bookRef.current = instance
  }, [])

  const schedulePageTurn = useCallback((
    direction: 'previous' | 'next',
    trigger: HTMLButtonElement
  ) => {
    if (pendingPageTurnFrameRef.current !== null) return

    pendingPageTurnButtonRef.current = trigger
    trigger.dataset.turning = 'true'
    trigger.setAttribute('aria-busy', 'true')

    pendingPageTurnFrameRef.current = window.requestAnimationFrame(() => {
      pendingPageTurnFrameRef.current = window.requestAnimationFrame(() => {
        pendingPageTurnFrameRef.current = null
        try {
          const pageFlip = bookRef.current
          if (direction === 'previous') pageFlip?.flipPrev('bottom')
          else pageFlip?.flipNext('bottom')
        } finally {
          delete trigger.dataset.turning
          trigger.removeAttribute('aria-busy')
          pendingPageTurnButtonRef.current = null
        }
      })
    })
  }, [])

  const toggleFullscreen = async () => {
    if (!readerRef.current) return
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else {
      await readerRef.current.requestFullscreen()
    }
  }

  return (
    <div
      ref={readerRef}
      className="flipbook-reader-shell bg-white"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} book reader`}
    >
      <div className="flipbook-reader-toolbar-shell sticky top-20 z-40 border-b border-banner-light/25 bg-white/95 shadow-sm backdrop-blur md:top-24">
        <div className="flipbook-reader-toolbar mx-auto flex max-w-7xl flex-col gap-3 px-3 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/textbook"
              prefetch
              aria-label="Close book and return to bookshelf"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-banner-light/40 px-3 py-2 text-sm font-bold text-banner-dark transition-colors hover:bg-banner-light/10"
            >
              <CloseReaderLinkContent />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-base font-black text-banner-brown sm:text-lg">{title}</h1>
              <p className="truncate text-xs font-medium text-gray-500">{gradeLevel}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-full border border-gray-200 bg-gray-50 p-1 shadow-inner">
              <button
                type="button"
                onClick={event => schedulePageTurn('previous', event.currentTarget)}
                disabled={!isBookReady || currentPageIndex <= 0}
                className="rounded-full p-2 text-banner-dark hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Previous page"
              >
                <ChevronLeftIcon className="pointer-events-none h-5 w-5" aria-hidden="true" focusable="false" />
              </button>
              <label className="flex items-center gap-1 px-1 text-xs font-bold text-gray-600">
                <span className="hidden sm:inline">Page</span>
                <input
                  type="number"
                  min="1"
                  max={numPages || 1}
                  value={pageInput}
                  onChange={event => setPageInput(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter') goToPage()
                  }}
                  className="w-14 rounded-full border border-gray-200 bg-white px-2 py-1 text-center text-sm text-banner-brown outline-none focus:border-banner-dark"
                  aria-label="Page number"
                />
                <span className="inline-block w-12 whitespace-nowrap text-left sm:w-14">/ {numPages || '—'}</span>
              </label>
              <button
                type="button"
                onClick={goToPage}
                className="mx-1 rounded-full bg-banner-dark px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0b5427]"
              >
                Go
              </button>
              <button
                type="button"
                onClick={event => schedulePageTurn('next', event.currentTarget)}
                disabled={!isBookReady || !numPages || currentPageIndex >= numPages - 1}
                className="rounded-full p-2 text-banner-dark hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Next page"
              >
                <ChevronRightIcon className="pointer-events-none h-5 w-5" aria-hidden="true" focusable="false" />
              </button>
            </div>

            <div className="flex items-center rounded-full border border-gray-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setZoom(value => Math.max(0.75, Number((value - 0.1).toFixed(2))))}
                className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
                aria-label="Zoom out"
              >
                <MagnifyingGlassMinusIcon className="h-5 w-5" />
              </button>
              <span className="min-w-11 text-center text-xs font-bold text-gray-500">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoom(value => Math.min(1.5, Number((value + 0.1).toFixed(2))))}
                className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
                aria-label="Zoom in"
              >
                <MagnifyingGlassPlusIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                className={`rounded-full p-2 hover:bg-gray-100 ${isFullscreen ? 'text-banner-dark' : 'text-gray-600'}`}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                <ArrowsPointingOutIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flipbook-stage" style={stageStyle} aria-live="polite">
        <button
          type="button"
          onClick={event => schedulePageTurn('previous', event.currentTarget)}
          disabled={!isBookReady || currentPageIndex <= 0}
          className="flipbook-side-navigation flipbook-side-navigation-left"
          aria-label="Previous page from left side"
        >
          <ChevronLeftIcon className="pointer-events-none h-7 w-7" aria-hidden="true" focusable="false" />
        </button>

        {canLoadDocument ? <Document
          className="w-full max-w-[1320px] shrink-0"
          file={pdfUrl}
          options={documentOptions}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={error => {
            console.error('Unable to load book PDF:', error)
            setLoadError('This book could not be opened. Please refresh or contact an administrator.')
          }}
          loading={(
            <BookLoadingPreview coverUrl={coverUrl} message="Loading book…" />
          )}
          error={(
            <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700 shadow">
              {loadError || 'Unable to load this book.'}
            </div>
          )}
        >
          {numPages > 0 && (
            <div className="flipbook-viewport-frame relative w-full">
              {!isFirstPageRendered && (
                <div className="absolute inset-x-0 top-0 z-30">
                  <BookLoadingPreview coverUrl={coverUrl} message="Preparing first page…" />
                </div>
              )}
              <div className="flipbook-zoom-layer" style={{ transform: `scale(${zoom})` }}>
                <RealPageFlipWindow
                  key={`${pageWindowStart}-${bookWidth}x${pageHeight}`}
                  pageNumbers={windowPages}
                  windowStart={pageWindowStart}
                  currentPageIndex={currentPageIndex}
                  renderPageIndex={renderPageIndex}
                  pageWidth={pageWidth}
                  pageHeight={pageHeight}
                  bookWidth={bookWidth}
                  devicePixelRatio={devicePixelRatio}
                  onFirstPageRendered={onFirstPageRendered}
                  onFlip={handleEngineFlip}
                  onReady={handleBookReady}
                  onInstanceChange={handleBookInstanceChange}
                />
              </div>
            </div>
          )}
        </Document> : (
          <BookLoadingPreview coverUrl={coverUrl} message="Opening book…" />
        )}

        <button
          type="button"
          onClick={event => schedulePageTurn('next', event.currentTarget)}
          disabled={!isBookReady || !numPages || currentPageIndex >= numPages - 1}
          className="flipbook-side-navigation flipbook-side-navigation-right"
          aria-label="Next page from right side"
        >
          <ChevronRightIcon className="pointer-events-none h-7 w-7" aria-hidden="true" focusable="false" />
        </button>
      </div>

      {numPages > 0 && (
        <div className="flipbook-progress" aria-hidden="true">
          <span>{currentPageIndex + 1}</span>
          <div className="flipbook-progress-track">
            <i style={{ width: `${((currentPageIndex + 1) / numPages) * 100}%` }} />
          </div>
        </div>
      )}

    </div>
  )
}
