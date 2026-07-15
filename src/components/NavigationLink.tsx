import Link from 'next/link'

const navigationClassName = 'text-banner-dark/70 hover:text-banner-dark inline-flex min-h-9 items-center px-1 pt-1 border-b-2 border-transparent hover:border-banner-light text-sm font-semibold whitespace-nowrap transition-[color,border-color,transform] duration-100 active:scale-95'

export default function NavigationLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} prefetch={true} className={navigationClassName}>
      {label}
    </Link>
  )
}
