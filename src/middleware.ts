import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
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

  return await updateSession(request)
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
