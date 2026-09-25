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
const MOBILE_PAGE_WINDOW_SIZE = 3
const DESKTOP_PAGE_WINDOW_SIZE = 8
const PAGE_FLIP_PRELOAD_TIMEOUT_MS = 1400

function getPageWindowStart(targetIndex: number, totalPages: number, isMobile: boolean) {
  const windowSize = isMobile ? MOBILE_PAGE_WINDOW_SIZE : DESKTOP_PAGE_WINDOW_SIZE
  if (totalPages <= windowSize) return 0

  if (isMobile) {
    return Math.max(0, Math.min(totalPages - windowSize, targetIndex - 1))
  }

  // Landscape mode needs a real book window: previous spread, current spread,
  // and next spread. Without the previous spread, back-flips disappear; without
  // the next spread, the turning sheet can briefly look like a blank card.
  if (targetIndex <= 1) return 0
  const currentSpreadLeftIndex = targetIndex % 2 === 0 ? targetIndex - 1 : targetIndex
  return Math.max(0, Math.min(totalPages - windowSize, currentSpreadLeftIndex - 2))
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
  onPageRendered: (pageNumber: number) => void
}

const PdfBookPageContent = memo(function PdfBookPageContent({
  pageNumber,
  pageWidth,
  devicePixelRatio,
  shouldRender,
  onPageRendered,
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
          onRenderSuccess={() => onPageRendered(pageNumber)}
          loading={<PagePlaceholder pageNumber={pageNumber} />}
        />
      ) : (
        <PagePlaceholder pageNumber={pageNumber} />
      )}
    </div>
  )
})

type PortalPageTarget = {
  pageNumber: number
  element: HTMLDivElement
}

function RealPageFlipWindow({
  pageNumbers,
  totalPages,
  currentPageIndex,
  renderPageIndex,
  pageWidth,
  pageHeight,
  bookWidth,
  devicePixelRatio,
  isMobile,
  onPageRendered,
  onFlip,
  onReady,
  onInstanceChange,
}: {
  pageNumbers: number[]
  totalPages: number
  currentPageIndex: number
  renderPageIndex: number
  pageWidth: number
  pageHeight: number
  bookWidth: number
  devicePixelRatio: number
  isMobile: boolean
  onPageRendered: (pageNumber: number) => void
  onFlip: (localIndex: number) => void
  onReady: () => void
  onInstanceChange: (instance: PageFlip | null) => void
}) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const bookElementRef = useRef<HTMLDivElement | null>(null)
  const currentPageIndexRef = useRef(currentPageIndex)
  const pageElementCacheRef = useRef(new Map<number, HTMLDivElement>())
  const [portalTargets, setPortalTargets] = useState<PortalPageTarget[]>([])

  useEffect(() => {
    currentPageIndexRef.current = currentPageIndex
  }, [currentPageIndex])

  useEffect(() => {
    const host = hostRef.current
    if (!host || pageNumbers.length === 0) return

    const bookElement = document.createElement('div')
    bookElement.className = 'banner-flipbook'
    bookElement.style.width = `${bookWidth}px`
    bookElement.style.height = `${pageHeight}px`
    bookElement.style.margin = '0 auto'

    const activePageNumbers = new Set(pageNumbers)
    for (const cachedPageNumber of pageElementCacheRef.current.keys()) {
      if (!activePageNumbers.has(cachedPageNumber)) pageElementCacheRef.current.delete(cachedPageNumber)
    }

    const targets = pageNumbers.map(pageNumber => {
      const element = pageElementCacheRef.current.get(pageNumber) ?? document.createElement('div')
      element.className = 'flipbook-page'
      element.dataset.density = 'soft'
      element.dataset.pageNumber = String(pageNumber)
      pageElementCacheRef.current.set(pageNumber, element)
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
  }, [bookWidth, pageHeight, pageNumbers, totalPages])

  useEffect(() => {
    const bookElement = bookElementRef.current
    const targetsMatchWindow = portalTargets.length === pageNumbers.length
      && portalTargets.every((target, index) => target.pageNumber === pageNumbers[index])
    if (!bookElement || !targetsMatchWindow) return

    const requestedStartPage = pageNumbers.indexOf(currentPageIndexRef.current + 1)
    const startPage = Math.max(0, requestedStartPage)
    let acceptFlipEvents = false
    let readyTimer = 0
    const pageFlip = new PageFlip(bookElement, {
      width: pageWidth,
      height: pageHeight,
      size: 'fixed',
      startPage,
      drawShadow: true,
      flippingTime: 620,
      usePortrait: isMobile,
      startZIndex: 0,
      autoSize: false,
      maxShadowOpacity: 0.68,
      showCover: pageNumbers[0] === 1,
      mobileScrollSupport: true,
      clickEventForward: false,
      useMouseEvents: true,
      swipeDistance: 24,
      showPageCorners: true,
      disableFlipByClick: false,
    })

    pageFlip.on('flip', event => {
      const localIndex = Number(event.data)
      if (!acceptFlipEvents) return
      const globalIndex = (pageNumbers[localIndex] ?? pageNumbers[0]) - 1
      onFlip(globalIndex)
    })
    pageFlip.on('init', () => {
      readyTimer = window.setTimeout(() => {
        acceptFlipEvents = true
        onReady()
      }, 60)
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
  }, [isMobile, onFlip, onInstanceChange, onReady, pageHeight, pageNumbers, pageWidth, portalTargets])

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
          shouldRender={Math.abs(pageNumber - 1 - renderPageIndex) <= (isMobile ? 1 : 4)}
          onPageRendered={onPageRendered}
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
  const pendingPageTurnTimerRef = useRef<number | null>(null)
  const pendingPageRenderTimerRef = useRef<number | null>(null)
  const currentPageIndexRef = useRef(0)
  const renderedPageNumbersRef = useRef(new Set<number>())
  const [numPages, setNumPages] = useState(0)
  const [canLoadDocument, setCanLoadDocument] = useState(false)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [renderPageIndex, setRenderPageIndex] = useState(0)
  const [windowStartIndex, setWindowStartIndex] = useState(0)
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
    ? viewportWidth - 16
    : Math.floor((viewportWidth - 64) / 2)
  const heightLimitedPageWidth = Math.floor(
    Math.max(250, viewportHeight - (isMobile ? 120 : 80)) / BOOK_PAGE_ASPECT_RATIO
  )
  const pageWidth = Math.max(
    180,
    Math.min(isMobile ? 450 : 1000, widthLimitedPageWidth, heightLimitedPageWidth)
  )
  const pageHeight = Math.round(pageWidth * BOOK_PAGE_ASPECT_RATIO)
  const bookWidth = isMobile ? pageWidth : pageWidth * 2
  const devicePixelRatio = isMobile
    ? Math.min(window.devicePixelRatio || 1, 1.15)
    : Math.min(window.devicePixelRatio || 1, 1.5)
  const documentOptions = useMemo(
    () => ({ rangeChunkSize: (isMobile ? 128 : 256) * 1024 }),
    [isMobile]
  )
  const pageWindowSize = isMobile ? MOBILE_PAGE_WINDOW_SIZE : DESKTOP_PAGE_WINDOW_SIZE
  const windowPages = useMemo(() => {
    const count = Math.min(pageWindowSize, Math.max(0, numPages - windowStartIndex))
    return Array.from({ length: count }, (_, index) => windowStartIndex + index + 1)
  }, [numPages, pageWindowSize, windowStartIndex])

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
    if (pendingPageTurnTimerRef.current !== null) {
      window.clearTimeout(pendingPageTurnTimerRef.current)
    }
    if (pendingPageRenderTimerRef.current !== null) {
      window.clearTimeout(pendingPageRenderTimerRef.current)
    }
  }, [])

  const onDocumentLoadSuccess = useCallback((pdf: PDFDocumentProxy) => {
    setLoadError('')
    setIsFirstPageRendered(false)
    renderedPageNumbersRef.current.clear()
    const savedPage = Number.parseInt(localStorage.getItem(storageKey) || '1', 10)
    const targetIndex = Number.isFinite(savedPage)
      ? Math.max(0, Math.min(pdf.numPages - 1, savedPage - 1))
      : 0
    currentPageIndexRef.current = targetIndex
    setCurrentPageIndex(targetIndex)
    setRenderPageIndex(targetIndex)
    setWindowStartIndex(getPageWindowStart(targetIndex, pdf.numPages, isMobile))
    setPageInput(String(targetIndex + 1))
    setNumPages(pdf.numPages)
    setIsBookReady(false)
  }, [isMobile, storageKey])

  const onPageRendered = useCallback((pageNumber: number) => {
    renderedPageNumbersRef.current.add(pageNumber)
    setIsFirstPageRendered(true)
  }, [])

  const updateCurrentPage = useCallback((index: number, deferUi = false) => {
    const safeIndex = Math.max(0, Math.min(numPages - 1, index))
    currentPageIndexRef.current = safeIndex
    const updatePageControls = () => {
      setCurrentPageIndex(safeIndex)
      setPageInput(String(safeIndex + 1))
    }
    if (deferUi) startTransition(updatePageControls)
    else updatePageControls()

    if (pendingPageRenderTimerRef.current !== null) {
      window.clearTimeout(pendingPageRenderTimerRef.current)
    }
    pendingPageRenderTimerRef.current = window.setTimeout(() => {
      pendingPageRenderTimerRef.current = null
      startTransition(() => {
        setRenderPageIndex(safeIndex)
        setWindowStartIndex(previousStart => {
          const previousEnd = Math.min(numPages - 1, previousStart + pageWindowSize - 1)
          const desiredStart = getPageWindowStart(safeIndex, numPages, isMobile)
          const staysInsideSafeWindow = isMobile
            ? safeIndex > previousStart && safeIndex < previousEnd
            : previousStart === desiredStart
          return staysInsideSafeWindow
            ? previousStart
            : desiredStart
        })
      })
      localStorage.setItem(storageKey, String(safeIndex + 1))
    }, 500)
  }, [isMobile, numPages, pageWindowSize, storageKey])

  const goToPage = () => {
    if (!numPages) return
    const requestedPage = Number.parseInt(pageInput, 10)
    if (!Number.isFinite(requestedPage)) {
      setPageInput(String(currentPageIndex + 1))
      return
    }
    const targetIndex = Math.max(0, Math.min(numPages - 1, requestedPage - 1))
    updateCurrentPage(targetIndex)
    const localIndex = windowPages.indexOf(targetIndex + 1)
    if (localIndex >= 0) bookRef.current?.turnToPage(localIndex)
    else setWindowStartIndex(getPageWindowStart(targetIndex, numPages, isMobile))
  }

  const handleEngineFlip = useCallback((localIndex: number) => {
    updateCurrentPage(localIndex, true)
  }, [updateCurrentPage])

  const handleBookReady = useCallback(() => setIsBookReady(true), [])
  const handleBookInstanceChange = useCallback((instance: PageFlip | null) => {
    bookRef.current = instance
  }, [])

  const getTargetSpreadPageNumbers = useCallback((targetIndex: number) => {
    const firstPageNumber = targetIndex + 1
    if (isMobile) return [firstPageNumber]
    const secondPageNumber = Math.min(numPages, firstPageNumber + 1)
    return firstPageNumber === secondPageNumber
      ? [firstPageNumber]
      : [firstPageNumber, secondPageNumber]
  }, [isMobile, numPages])

  const waitForRenderedPages = useCallback((pageNumbers: number[]) => new Promise<void>(resolve => {
    const startedAt = Date.now()
    const check = () => {
      const allPagesReady = pageNumbers.every(pageNumber => {
        if (renderedPageNumbersRef.current.has(pageNumber)) return true
        return !!readerRef.current?.querySelector(`.flipbook-page[data-page-number="${pageNumber}"] canvas`)
      })
      if (allPagesReady || Date.now() - startedAt >= PAGE_FLIP_PRELOAD_TIMEOUT_MS) {
        resolve()
        return
      }
      window.setTimeout(check, 40)
    }
    check()
  }), [])

  const schedulePageTurn = useCallback((direction: 'previous' | 'next') => {
    if (
      pendingPageTurnFrameRef.current !== null
      || pendingPageTurnTimerRef.current !== null
    ) return

    if (readerRef.current) readerRef.current.dataset.turning = direction
    const pageStep = isMobile ? 1 : 2
    const targetIndex = direction === 'previous'
      ? Math.max(0, currentPageIndexRef.current - pageStep)
      : Math.min(numPages - 1, currentPageIndexRef.current + pageStep)
    const targetWindowStartIndex = getPageWindowStart(targetIndex, numPages, isMobile)
    const targetIsInsideWindow = targetIndex >= windowStartIndex
      && targetIndex < windowStartIndex + pageWindowSize

    // Pre-warm the target spread before starting the page-flip animation. This
    // keeps the next/previous sheet real during the curl instead of revealing a
    // white placeholder while react-pdf catches up.
    setRenderPageIndex(targetIndex)
    if (!targetIsInsideWindow) setWindowStartIndex(targetWindowStartIndex)

    pendingPageTurnFrameRef.current = window.requestAnimationFrame(() => {
      pendingPageTurnFrameRef.current = null
      pendingPageTurnTimerRef.current = window.setTimeout(async () => {
        await waitForRenderedPages(getTargetSpreadPageNumbers(targetIndex))
        pendingPageTurnTimerRef.current = null
        if (readerRef.current) delete readerRef.current.dataset.turning
        const pageFlip = bookRef.current
        if (direction === 'previous') pageFlip?.flipPrev('top')
        else pageFlip?.flipNext('top')
      }, targetIsInsideWindow ? 120 : 220)
    })
  }, [getTargetSpreadPageNumbers, isMobile, numPages, pageWindowSize, waitForRenderedPages, windowStartIndex])

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
      <div className="flipbook-reader-toolbar-shell z-40 shrink-0 border-b border-banner-light/25 bg-white/95 shadow-sm backdrop-blur">
        <div className="flipbook-reader-toolbar mx-auto flex max-w-7xl flex-col gap-2 px-2 py-1.5 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/textbook"
              prefetch
              aria-label="Close book and return to bookshelf"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-banner-light/40 px-2.5 py-1 text-sm font-bold text-banner-dark transition-colors hover:bg-banner-light/10"
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
                onClick={() => schedulePageTurn('previous')}
                disabled={!isBookReady || currentPageIndex <= 0}
                className="rounded-full p-1.5 text-banner-dark hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Previous page"
              >
                <ChevronLeftIcon className="pointer-events-none h-4 w-4" aria-hidden="true" focusable="false" />
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
                className="mx-1 rounded-full bg-banner-dark px-2.5 py-1 text-xs font-bold text-white hover:bg-[#0b5427]"
              >
                Go
              </button>
              <button
                type="button"
                onClick={() => schedulePageTurn('next')}
                disabled={!isBookReady || !numPages || currentPageIndex >= numPages - 1}
                className="rounded-full p-1.5 text-banner-dark hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Next page"
              >
                <ChevronRightIcon className="pointer-events-none h-4 w-4" aria-hidden="true" focusable="false" />
              </button>
            </div>

            <div className="flex items-center rounded-full border border-gray-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setZoom(value => Math.max(0.75, Number((value - 0.1).toFixed(2))))}
                className="rounded-full p-1.5 text-gray-600 hover:bg-gray-100"
                aria-label="Zoom out"
              >
                <MagnifyingGlassMinusIcon className="h-4 w-4" />
              </button>
              <span className="min-w-11 text-center text-xs font-bold text-gray-500">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoom(value => Math.min(1.5, Number((value + 0.1).toFixed(2))))}
                className="rounded-full p-1.5 text-gray-600 hover:bg-gray-100"
                aria-label="Zoom in"
              >
                <MagnifyingGlassPlusIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                className={`rounded-full p-1.5 hover:bg-gray-100 ${isFullscreen ? 'text-banner-dark' : 'text-gray-600'}`}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                <ArrowsPointingOutIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flipbook-stage" style={stageStyle} aria-live="polite">
        <button
          type="button"
          onClick={() => schedulePageTurn('previous')}
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
                  key={`flipbook-${bookWidth}x${pageHeight}`}
                  pageNumbers={windowPages}
                  totalPages={numPages}
                  currentPageIndex={currentPageIndex}
                  renderPageIndex={renderPageIndex}
                  pageWidth={pageWidth}
                  pageHeight={pageHeight}
                  bookWidth={bookWidth}
                  devicePixelRatio={devicePixelRatio}
                  isMobile={isMobile}
                  onPageRendered={onPageRendered}
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
          onClick={() => schedulePageTurn('next')}
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
