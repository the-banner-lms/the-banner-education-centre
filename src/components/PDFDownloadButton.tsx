'use client'

import { useState } from 'react'

export default function PDFDownloadButton({ targetId, filename }: { targetId: string, filename: string }) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      // Temporarily change document title to control the default PDF filename
      const originalTitle = document.title;
      // Extract filename without extension if provided, otherwise fallback
      const printTitle = filename ? filename.replace(/\.pdf$/i, '') : 'download';
      document.title = printTitle;

      // Small timeout to allow the button to show "Preparing..." before print dialog blocks the thread
      setTimeout(() => {
        window.print()
        // Restore original title
        document.title = originalTitle;
        setIsDownloading(false)
      }, 100)
    } catch (err) {
      console.error('Error opening print dialog:', err)
      alert('Failed to generate PDF. Error: ' + (err as Error).message)
      // Make sure to restore title even on error
      document.title = "The Banner Education Centre";
      setIsDownloading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-semibold text-sm disabled:opacity-50 hide-in-pdf"
    >
      {isDownloading ? 'Generating PDF...' : 'Download as PDF'}
    </button>
  )
}
