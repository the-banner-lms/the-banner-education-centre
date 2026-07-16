const navigationClassName = 'text-banner-dark hover:text-banner-dark inline-flex min-h-9 items-center px-1 pt-1 border-b-2 border-transparent hover:border-banner-light text-sm font-semibold whitespace-nowrap transition-colors duration-100'

export default function NavigationLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className={navigationClassName}>
      {label}
    </a>
  )
}
