'use client'

import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

export default function TuitionInvoiceDownloadLink({
  feeId,
  invoiceNumber,
}: {
  feeId: string
  invoiceNumber: string | null
}) {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

  if (!invoiceNumber) return <span className="text-xs text-gray-500">Preparing…</span>

  const downloadInvoice = async () => {
    setDownloading(true)
    setError('')
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const iosPreview = isIos ? window.open('', '_blank') : null

    try {
      const response = await fetch(`/api/tuition-invoice/${feeId}`, {
        credentials: 'same-origin',
        cache: 'no-store',
      })
      if (!response.ok) throw new Error(response.status === 401 ? 'Please sign in again.' : 'Invoice download failed.')
      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('application/pdf')) throw new Error('The server did not return a PDF.')

      const sourceBlob = await response.blob()
      const pdfBlob = sourceBlob.type === 'application/pdf'
        ? sourceBlob
        : new Blob([sourceBlob], { type: 'application/pdf' })
      const pdfUrl = URL.createObjectURL(pdfBlob)

      if (iosPreview && !iosPreview.closed) {
        iosPreview.location.replace(pdfUrl)
        window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 300000)
      } else {
        const link = document.createElement('a')
        link.href = pdfUrl
        link.download = `${invoiceNumber}.pdf`
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000)
      }
    } catch (downloadError) {
      if (iosPreview && !iosPreview.closed) iosPreview.close()
      setError(downloadError instanceof Error ? downloadError.message : 'Invoice download failed.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={downloadInvoice}
        disabled={downloading}
        className="inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-lg border border-green-700 bg-white px-3 py-2 text-xs font-black text-green-800 hover:bg-green-50 disabled:cursor-wait disabled:opacity-60"
        aria-label={`Download invoice ${invoiceNumber}`}
        aria-busy={downloading}
      >
        <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" focusable="false" />
        {downloading ? 'Preparing…' : 'Download PDF'}
      </button>
      {error && <p className="mt-1 max-w-36 text-xs font-semibold leading-4 text-red-700" role="alert">{error}</p>}
    </div>
  )
}
