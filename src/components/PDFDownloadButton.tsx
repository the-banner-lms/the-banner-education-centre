'use client'

import { useState } from 'react'
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'

const waitForNextPaint = () => new Promise<void>((resolve) => {
  requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
})

const isIOSDevice = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export default function PDFDownloadButton({ targetId, filename }: { targetId: string, filename: string }) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    // iOS Safari can block a Blob URL opened after asynchronous canvas work.
    // Open the tab while the click still has a user gesture, then navigate it
    // to the generated PDF when it is ready.
    const iosPreview = isIOSDevice() ? window.open('', '_blank') : null
    if (iosPreview) {
      iosPreview.document.title = 'Generating PDF...'
      iosPreview.document.body.textContent = 'Generating PDF...'
    }

    setIsDownloading(true)
    let restoreHiddenElements = () => {}

    try {
      const element = document.getElementById(targetId)
      if (!element) {
        throw new Error(`Element with id ${targetId} not found`)
      }

      // Temporarily hide elements that shouldn't be in PDF
      const hideElements = element.querySelectorAll('.hide-in-pdf')
      const originalDisplays: string[] = []
      hideElements.forEach((el) => {
        originalDisplays.push((el as HTMLElement).style.display)
        ;(el as HTMLElement).style.display = 'none'
      })
      
      const showElements = element.querySelectorAll('.show-only-in-pdf')
      const originalShowDisplays: string[] = []
      showElements.forEach((el) => {
         originalShowDisplays.push((el as HTMLElement).style.display)
         ;(el as HTMLElement).style.display = 'block'
      })

      restoreHiddenElements = () => {
        hideElements.forEach((el, index) => {
          ;(el as HTMLElement).style.display = originalDisplays[index]
        })
        showElements.forEach((el, index) => {
          ;(el as HTMLElement).style.display = originalShowDisplays[index]
        })
      }

      await waitForNextPaint()

      // Ensure the element is visible and rendered correctly before capture
      const isMobile = window.matchMedia('(max-width: 768px)').matches
      let scale = isMobile ? 1 : 2
      
      // Stay below conservative mobile browser canvas and memory limits.
      const captureWidth = Math.max(element.scrollWidth, element.offsetWidth)
      const captureHeight = Math.max(element.scrollHeight, element.offsetHeight)
      const elementArea = captureWidth * captureHeight
      const maxMobilePixels = 4000000
      const maxMobileDimension = 4096
      if (isMobile && (elementArea * scale * scale) > maxMobilePixels) {
        scale = Math.sqrt(maxMobilePixels / elementArea)
      }
      if (isMobile) {
        scale = Math.min(
          scale,
          maxMobileDimension / captureWidth,
          maxMobileDimension / captureHeight,
        )
      }

      const canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: captureWidth,
        windowHeight: captureHeight,
        imageTimeout: 10000,
      })

      restoreHiddenElements()

      if (!canvas.width || !canvas.height) {
        throw new Error('Dashboard capture is empty')
      }
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const pageMargin = 8
      const printableWidth = pageWidth - (pageMargin * 2)
      const printableHeight = pageHeight - (pageMargin * 2)
      const sliceHeight = Math.max(1, Math.floor((canvas.width * printableHeight) / printableWidth))

      // Embed a real, page-sized image on each PDF page. Reusing one extremely
      // tall image with negative offsets can render as blank in mobile viewers.
      let pageIndex = 0
      for (let sourceY = 0; sourceY < canvas.height; sourceY += sliceHeight) {
        const currentSliceHeight = Math.min(sliceHeight, canvas.height - sourceY)
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = canvas.width
        pageCanvas.height = currentSliceHeight

        const pageContext = pageCanvas.getContext('2d')
        if (!pageContext) {
          throw new Error('Unable to prepare PDF page')
        }

        pageContext.fillStyle = '#ffffff'
        pageContext.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
        pageContext.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          currentSliceHeight,
          0,
          0,
          pageCanvas.width,
          pageCanvas.height,
        )

        if (pageIndex > 0) {
          pdf.addPage()
        }

        const pageImage = pageCanvas.toDataURL('image/jpeg', isMobile ? 0.78 : 0.88)
        const renderedHeight = (currentSliceHeight * printableWidth) / canvas.width
        pdf.addImage(
          pageImage,
          'JPEG',
          pageMargin,
          pageMargin,
          printableWidth,
          renderedHeight,
          `dashboard-page-${pageIndex}`,
          'MEDIUM',
        )

        pageCanvas.width = 1
        pageCanvas.height = 1
        pageIndex += 1
      }

      canvas.width = 1
      canvas.height = 1
      
      const saveFilename = filename ? (filename.endsWith('.pdf') ? filename : `${filename}.pdf`) : 'download.pdf'
      const pdfBlob = pdf.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)

      if (iosPreview && !iosPreview.closed) {
        iosPreview.location.replace(pdfUrl)
        // Keep the URL alive while the iOS PDF viewer loads it.
        window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 300000)
      } else {
        const downloadLink = document.createElement('a')
        downloadLink.href = pdfUrl
        downloadLink.download = saveFilename
        downloadLink.style.display = 'none'
        document.body.appendChild(downloadLink)
        downloadLink.click()
        downloadLink.remove()
        window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000)
      }

    } catch (err) {
      if (iosPreview && !iosPreview.closed) {
        iosPreview.close()
      }
      console.error('Error generating PDF:', err)
      alert('Failed to generate PDF. Error: ' + (err as Error).message)
    } finally {
      restoreHiddenElements()
      setIsDownloading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-semibold text-sm disabled:opacity-50 hide-in-pdf"
      aria-busy={isDownloading}
    >
      {isDownloading ? 'Generating PDF...' : 'Download as PDF'}
    </button>
  )
}
