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
import Link, { useLinkStatus } from 'next/link'
import { PageFlip } from 'page-flip'
import { Document, Page, pdfjs } from 'react-pdf'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import {
  ArrowLeftIcon,
  ArrowsPointingOutIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
} from '@heroicons/react/24/outline'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

const BOOK_PAGE_ASPECT_RATIO = 1.414

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
  renderRadius: number
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
          onRenderSuccess={pageNumber === 1 ? onFirstPageRendered : undefined}
          loading={<PagePlaceholder pageNumber={pageNumber} />}
        />
      ) : (
        <PagePlaceholder pageNumber={pageNumber} />
      )}
      <span className="flipbook-page-number">{pageNumber}</span>
    </div>
  )
})

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

function BookshelfLinkContent() {
  const { pending } = useLinkStatus()

  return (
    <>
      <ArrowLeftIcon className={`h-4 w-4 ${pending ? 'animate-pulse' : ''}`} aria-hidden="true" focusable="false" />
      <span className="hidden sm:inline">{pending ? 'Opening…' : 'Bookshelf'}</span>
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
  const bookRef = useRef<PageFlip | null>(null)
  const bookContainerRef = useRef<HTMLDivElement | null>(null)
  const readerRef = useRef<HTMLDivElement | null>(null)
  const pendingPageTurnFrameRef = useRef<number | null>(null)
  const pendingPageTurnButtonRef = useRef<HTMLButtonElement | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [canLoadDocument, setCanLoadDocument] = useState(false)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [pageInput, setPageInput] = useState('1')
  const [zoom, setZoom] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isBookReady, setIsBookReady] = useState(false)
  const [isFirstPageRendered, setIsFirstPageRendered] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth)
  const storageKey = `banner-book-progress:${bookId}`

  const isMobile = viewportWidth < 640
  const pageWidth = isMobile
    ? Math.max(260, Math.min(360, viewportWidth - 28))
    : Math.max(360, Math.min(560, Math.floor((viewportWidth - 64) / 2)))
  const pageHeight = Math.round(pageWidth * BOOK_PAGE_ASPECT_RATIO)
  const bookWidth = isMobile ? pageWidth : pageWidth * 2
  const renderRadius = isMobile ? 1 : 3
  const devicePixelRatio = isMobile
    ? Math.min(window.devicePixelRatio || 1, 1.35)
    : Math.min(window.devicePixelRatio || 1, 2)
  const documentOptions = useMemo(
    () => isMobile
      ? { disableAutoFetch: true, disableStream: true, rangeChunkSize: 256 * 1024 }
      : { rangeChunkSize: 256 * 1024 },
    [isMobile]
  )

  const pages = useMemo(
    () => Array.from({ length: numPages }, (_, index) => index + 1),
    [numPages]
  )
  const stageStyle = {
    '--flipbook-book-width': `${bookWidth}px`,
    '--flipbook-book-height': `${pageHeight}px`,
    '--flipbook-page-width': `${pageWidth}px`,
  } as CSSProperties

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth)
    updateViewportWidth()
    window.addEventListener('resize', updateViewportWidth, { passive: true })
    return () => window.removeEventListener('resize', updateViewportWidth)
  }, [])

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
    if (pendingPageTurnButtonRef.current) {
      delete pendingPageTurnButtonRef.current.dataset.turning
      pendingPageTurnButtonRef.current.removeAttribute('aria-busy')
    }
  }, [])

  useEffect(() => {
    if (!numPages || !isBookReady) return
    const savedPage = Number.parseInt(localStorage.getItem(storageKey) || '1', 10)
    if (!Number.isFinite(savedPage) || savedPage <= 1 || savedPage > numPages) return

    const targetIndex = savedPage - 1
    setCurrentPageIndex(targetIndex)
    setPageInput(String(savedPage))
    window.requestAnimationFrame(() => bookRef.current?.turnToPage(targetIndex))
  }, [isBookReady, numPages, storageKey])

  const onDocumentLoadSuccess = useCallback((pdf: PDFDocumentProxy) => {
    setLoadError('')
    setIsFirstPageRendered(false)
    setNumPages(pdf.numPages)
  }, [])

  const onFirstPageRendered = useCallback(() => setIsFirstPageRendered(true), [])

  const updateCurrentPage = useCallback((index: number) => {
    const safeIndex = Math.max(0, Math.min(numPages - 1, index))
    startTransition(() => {
      setCurrentPageIndex(safeIndex)
      setPageInput(String(safeIndex + 1))
    })
    localStorage.setItem(storageKey, String(safeIndex + 1))
  }, [numPages, storageKey])

  useEffect(() => {
    const container = bookContainerRef.current
    if (!container || numPages === 0) return

    const pageElements = Array.from(container.querySelectorAll<HTMLElement>(':scope > .flipbook-page'))
    if (pageElements.length !== numPages) return

    const pageFlip = new PageFlip(container, {
      width: pageWidth,
      height: pageHeight,
      size: 'fixed',
      startPage: 0,
      drawShadow: true,
      flippingTime: 360,
      usePortrait: true,
      startZIndex: 0,
      autoSize: false,
      maxShadowOpacity: 0.45,
      showCover: false,
      mobileScrollSupport: true,
      clickEventForward: true,
      useMouseEvents: true,
      swipeDistance: 24,
      showPageCorners: true,
      disableFlipByClick: false,
    })

    bookRef.current = pageFlip
    pageFlip.on('flip', event => updateCurrentPage(Number(event.data)))
    pageFlip.on('init', () => setIsBookReady(true))
    pageFlip.loadFromHTML(pageElements)

    return () => {
      pageFlip.off('flip')
      pageFlip.off('init')
      bookRef.current = null
      try {
        pageFlip.destroy()
      } catch {
        // The page container may already be removed during route transitions.
      }
    }
  }, [numPages, pageHeight, pageWidth, updateCurrentPage])

  const goToPage = () => {
    if (!numPages) return
    const requestedPage = Number.parseInt(pageInput, 10)
    if (!Number.isFinite(requestedPage)) {
      setPageInput(String(currentPageIndex + 1))
      return
    }
    const targetIndex = Math.max(0, Math.min(numPages - 1, requestedPage - 1))
    updateCurrentPage(targetIndex)
    window.requestAnimationFrame(() => bookRef.current?.turnToPage(targetIndex))
  }

  const schedulePageTurn = useCallback((
    direction: 'previous' | 'next',
    trigger: HTMLButtonElement
  ) => {
    // page-flip performs synchronous DOM measurements before its animation starts.
    // Keep one complete paint between feedback and that work so the interaction is responsive.
    if (pendingPageTurnFrameRef.current !== null) return

    pendingPageTurnButtonRef.current = trigger
    trigger.dataset.turning = 'true'
    trigger.setAttribute('aria-busy', 'true')

    pendingPageTurnFrameRef.current = window.requestAnimationFrame(() => {
      pendingPageTurnFrameRef.current = window.requestAnimationFrame(() => {
        pendingPageTurnFrameRef.current = null
        try {
          const pageFlip = bookRef.current
          if (pageFlip) {
            if (direction === 'previous') {
              pageFlip.flipPrev('bottom')
            } else {
              pageFlip.flipNext('bottom')
            }
          }
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
    <div ref={readerRef} className="flipbook-reader-shell bg-[#eaf0ec]">
      <div className="sticky top-20 z-40 border-b border-banner-light/25 bg-white/95 shadow-sm backdrop-blur md:top-24">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-3 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/textbook"
              prefetch
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-banner-light/40 px-3 py-2 text-sm font-bold text-banner-dark transition-colors hover:bg-banner-light/10"
            >
              <BookshelfLinkContent />
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
                <span className="whitespace-nowrap">/ {numPages || '—'}</span>
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
                <div
                  key={`${bookWidth}x${pageHeight}`}
                  ref={bookContainerRef}
                  className="banner-flipbook"
                  style={{ width: bookWidth, height: pageHeight, margin: '0 auto' }}
                >
                  {pages.map(pageNumber => (
                    <div
                      key={pageNumber}
                      className="flipbook-page"
                      data-density="soft"
                    >
                      <PdfBookPageContent
                        pageNumber={pageNumber}
                        pageWidth={pageWidth}
                        renderRadius={renderRadius}
                        devicePixelRatio={devicePixelRatio}
                        shouldRender={Math.abs(pageNumber - 1 - currentPageIndex) <= renderRadius}
                        onFirstPageRendered={onFirstPageRendered}
                      />
                    </div>
                  ))}
                </div>
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

      <p className="px-4 pb-6 text-center text-xs font-medium text-gray-500 sm:text-sm">
        Tap a page corner, use the arrows, or swipe to turn the page. Your reading position is saved on this device.
      </p>
    </div>
  )
}
