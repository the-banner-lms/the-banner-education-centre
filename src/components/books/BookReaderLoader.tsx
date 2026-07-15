'use client'

import dynamic from 'next/dynamic'

const FlipbookReader = dynamic(() => import('./FlipbookReader'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#eef3ef] px-4">
      <div className="rounded-2xl bg-white px-8 py-7 text-center shadow-lg">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-banner-light border-t-banner-dark" />
        <p className="mt-4 font-semibold text-banner-brown">Preparing your book…</p>
      </div>
    </div>
  ),
})

export default FlipbookReader
