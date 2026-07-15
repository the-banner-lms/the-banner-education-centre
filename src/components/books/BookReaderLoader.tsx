'use client'

import dynamic from 'next/dynamic'
import BookReaderLoading from './BookReaderLoading'

const FlipbookReader = dynamic(() => import('./FlipbookReader'), {
  ssr: false,
  loading: () => <BookReaderLoading />,
})

export default FlipbookReader
