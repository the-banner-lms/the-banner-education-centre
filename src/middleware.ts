import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { hasSupabaseAuthCookie } from '@/utils/supabase/cookies'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''

  // Canonical Redirect: Force www.thebannereducentre.com
  const canonicalDomain = 'www.thebannereducentre.com'
  const isVercel = hostname.includes('vercel.app')
  const isNonWww = hostname === 'thebannereducentre.com'

  if (isVercel || isNonWww) {
    url.host = canonicalDomain
    url.port = '' // Ensure port is empty for standard HTTPS
    url.protocol = 'https:'
    return Response.redirect(url, 308) // 308 Permanent Redirect
  }

  // Keep middleware edge-safe and fast. Calling Supabase auth from middleware
  // can block every page request and cause Vercel MIDDLEWARE_INVOCATION_TIMEOUT.
  // Admin/staff/teacher pages still do their real role checks server-side.
  if (
    request.nextUrl.pathname.startsWith('/admin') &&
    !hasSupabaseAuthCookie(request.cookies.getAll())
  ) {
    url.pathname = '/login'
    url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)',
  ],
}
