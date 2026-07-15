'use client'

import Link, { useLinkStatus } from 'next/link'

const navigationClassName = 'text-banner-dark/70 hover:text-banner-dark inline-flex min-h-9 items-center px-1 pt-1 border-b-2 border-transparent hover:border-banner-light text-sm font-semibold whitespace-nowrap transition-[color,border-color,transform] duration-100 active:scale-95'

function NavigationLinkLabel({ label }: { label: string }) {
  const { pending } = useLinkStatus()

  return (
    <span className="inline-flex items-center gap-1.5">
      {pending && (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-banner-light border-t-banner-dark" aria-hidden="true" />
      )}
      {pending ? 'Opening…' : label}
    </span>
  )
}

export default function NavigationLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} prefetch className={navigationClassName}>
      <NavigationLinkLabel label={label} />
    </Link>
  )
}
