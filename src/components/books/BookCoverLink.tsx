'use client'

import Link, { useLinkStatus } from 'next/link'
import { ArrowPathIcon, BookOpenIcon, LockClosedIcon } from '@heroicons/react/24/outline'

type BookCoverLinkProps = {
  id: string
  title: string
  gradeLevel: string
  coverUrl: string | null
  isRestricted: boolean
}

function PendingOverlay() {
  const { pending } = useLinkStatus()

  if (!pending) return null

  return (
    <span className="absolute inset-0 z-20 flex items-center justify-center rounded-[inherit] bg-banner-dark/75 text-white backdrop-blur-[2px]" role="status">
      <span className="flex flex-col items-center gap-2 text-xs font-bold">
        <ArrowPathIcon className="h-8 w-8 animate-spin" aria-hidden="true" focusable="false" />
        Opening…
      </span>
    </span>
  )
}

export default function BookCoverLink({ id, title, gradeLevel, coverUrl, isRestricted }: BookCoverLinkProps) {
  return (
    <Link
      href={`/textbook/read/${id}`}
      prefetch
      aria-label={`Open ${title}`}
      className="book-cover-card group"
    >
      <div className="book-cover-face">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={`${title} cover`}
            width="700"
            height="972"
            className="absolute inset-0 block h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-banner-dark to-[#154926] p-5 text-center text-white">
            <BookOpenIcon className="mb-4 h-12 w-12 text-banner-light" aria-hidden="true" focusable="false" />
            <span className="text-lg font-black leading-tight">{title}</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-3 pb-3 pt-12 text-left text-white">
          <h2 className="line-clamp-2 text-sm font-bold leading-tight sm:text-base">{title}</h2>
          <div className="mt-1 flex items-center justify-between gap-2 text-xs text-white/80">
            <span className="truncate">{gradeLevel}</span>
            {isRestricted && <LockClosedIcon className="h-3.5 w-3.5 shrink-0" aria-label="Restricted book" />}
          </div>
        </div>
        <PendingOverlay />
      </div>
      <span className="mt-3 block truncate px-2 text-center text-sm font-bold text-banner-brown transition-colors group-hover:text-banner-dark">
        {title}
      </span>
    </Link>
  )
}
