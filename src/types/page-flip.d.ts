declare module 'page-flip' {
  export type PageFlipEvent = {
    data: number | string | { page: number; mode: 'portrait' | 'landscape' }
    object: PageFlip
  }

  export type PageFlipSettings = {
    width: number
    height: number
    size?: 'fixed' | 'stretch'
    minWidth?: number
    maxWidth?: number
    minHeight?: number
    maxHeight?: number
    startPage?: number
    drawShadow?: boolean
    flippingTime?: number
    usePortrait?: boolean
    startZIndex?: number
    autoSize?: boolean
    maxShadowOpacity?: number
    showCover?: boolean
    mobileScrollSupport?: boolean
    clickEventForward?: boolean
    useMouseEvents?: boolean
    swipeDistance?: number
    showPageCorners?: boolean
    disableFlipByClick?: boolean
  }

  export class PageFlip {
    constructor(element: HTMLElement, settings: PageFlipSettings)
    loadFromHTML(elements: HTMLElement[]): void
    on(event: 'flip' | 'init' | 'changeOrientation' | 'changeState' | 'update', handler: (event: PageFlipEvent) => void): this
    off(event: 'flip' | 'init' | 'changeOrientation' | 'changeState' | 'update'): void
    flipNext(corner?: 'top' | 'bottom'): void
    flipPrev(corner?: 'top' | 'bottom'): void
    turnToPage(page: number): void
    destroy(): void
  }
}
