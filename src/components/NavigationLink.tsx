'use client'

import { MouseEvent, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const navigationClassName = 'text-banner-dark hover:text-banner-dark inline-flex min-h-9 items-center px-1 pt-1 border-b-2 border-transparent hover:border-banner-light text-sm font-semibold whitespace-nowrap transition-[color,border-color,transform,opacity] duration-100 active:scale-95 data-[navigating=true]:opacity-80'

export default function NavigationLink({ href, label }: { href: string; label: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const linkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    router.prefetch(href)
  }, [href, router])

  useEffect(() => {
    linkRef.current?.removeAttribute('data-navigating')
  }, [pathname])

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }

    event.preventDefault()
    if (pathname === href) return

    const link = event.currentTarget
    link.dataset.navigating = 'true'

    // Let the browser paint the pressed/pending state before starting the
    // potentially expensive React Server Component route transition.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => router.push(href))
    })
  }

  return (
    <a ref={linkRef} href={href} onClick={handleClick} className={navigationClassName}>
      {label}
    </a>
  )
}
