'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigationBaseClassName = 'inline-flex min-h-9 items-center whitespace-nowrap border-b-2 px-1 pt-1 text-sm font-semibold text-banner-dark'
const navigationLinkClassName = `${navigationBaseClassName} border-transparent transition-colors duration-100 hover:border-banner-light hover:text-banner-dark`
const activeNavigationClassName = `${navigationBaseClassName} border-banner-dark`

export default function NavigationLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname()
  const isActive = href === '/'
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`)

  if (isActive) {
    return (
      <span aria-current="page" className={activeNavigationClassName}>
        {label}
      </span>
    )
  }

  return (
    <Link href={href} prefetch className={navigationLinkClassName}>
      {label}
    </Link>
  )
}
