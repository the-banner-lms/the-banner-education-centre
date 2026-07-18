import Link from 'next/link'
import { signout } from '@/app/login/actions'
import { getCurrentAuth } from '@/utils/supabase/auth'
import SearchPopup from './SearchPopup'
import NotificationBell from './NotificationBell'
import MobileMenu from './MobileMenu'
import NavigationLink from './NavigationLink'
import { EnvelopeIcon } from '@heroicons/react/24/outline'
import { getEnrollmentReviewNotices } from '@/lib/enrollmentNotices'

type NavbarNotification = {
  id: string
  title: string
  created_at: string
  href: string
  kind: 'announcement' | 'enrollment_review'
}

export default async function Navbar() {
  const { supabase, user, profile } = await getCurrentAuth()

  let unreadNotifications: NavbarNotification[] = [];

  if (user && profile) {
    // Fetch relevant announcements
    const { data: relevantAnnouncements } = await supabase
      .from('announcements')
      .select('id, title, created_at')
      .in('target_role', ['all', profile.role])
      .order('created_at', { ascending: false })
      .limit(20);

    if (relevantAnnouncements && relevantAnnouncements.length > 0) {
      const announcementIds = relevantAnnouncements.map(a => a.id);
      
      // Fetch read records for this user
      const { data: readRecords } = await supabase
        .from('announcement_reads')
        .select('announcement_id')
        .eq('user_id', user.id)
        .in('announcement_id', announcementIds);
        
      const readIds = new Set(readRecords?.map(r => r.announcement_id) || []);
      
      unreadNotifications = relevantAnnouncements
        .filter(a => !readIds.has(a.id))
        .map(announcement => ({
          ...announcement,
          href: `/announcements/${announcement.id}`,
          kind: 'announcement' as const,
        }));
    }

    if (profile.role === 'student') {
      const reviewNotices = await getEnrollmentReviewNotices(profile.email, profile.student_number, { unreadOnly: true, limit: 10 })
      unreadNotifications.push(...reviewNotices.map(notice => ({
        id: notice.id,
        title: notice.status === 'rejected'
          ? `Payment slip rejected${notice.payment_month ? ` · ${notice.payment_month}` : ''}: ${notice.review_reason || 'See admin notice'}`
          : `Payment slip verified${notice.payment_month ? ` · ${notice.payment_month}` : ''}`,
        created_at: notice.reviewed_at,
        href: '/dashboard',
        kind: 'enrollment_review' as const,
      })))
    }

    unreadNotifications.sort((first, second) => new Date(second.created_at).getTime() - new Date(first.created_at).getTime())
  }

  return (
    <nav className="sticky top-0 z-50 h-20 shrink-0 border-b border-banner-light/20 bg-white/80 backdrop-blur-md md:h-24 hide-in-pdf">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-full items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center space-x-3 text-2xl font-bold text-banner-dark group">
                <div className="relative overflow-hidden rounded-full bg-white shadow-sm border border-banner-light/20 p-1 group-hover:shadow-md transition-shadow duration-300">
                  <img src="/logo.png" alt="The Banner Education Centre Logo" width="64" height="64" className="h-12 w-12 md:h-16 md:w-16 object-contain transform group-hover:scale-105 transition-transform duration-500" />
                </div>
                <span className="hidden sm:block tracking-tight">The Banner</span>
              </Link>
            </div>
            <div className="hidden xl:ml-4 xl:flex xl:space-x-3 2xl:space-x-6">
              <NavigationLink href="/" label="Home" />
              <NavigationLink href="/textbook" label="Bookshelf" />
              <NavigationLink href="/blog" label="Blog" />
              <NavigationLink href="/activities" label="Activities" />
              <NavigationLink href="/team" label="Our Team" />
              <NavigationLink href="/enrollment" label="Enrollment" />
              {user && profile?.role === 'student' && (
                <NavigationLink href="/dashboard" label="Dashboard" />
              )}
              {user && profile?.role === 'teacher' && (
                <NavigationLink href="/teacher" label="Teacher" />
              )}
              {user && profile?.role === 'staff' && (
                <NavigationLink href="/staff" label="Staff" />
              )}
              {user && profile?.role === 'admin' && (
                <NavigationLink href="/admin" label="Admin" />
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center space-x-2 md:space-x-3 2xl:space-x-5">
            {user && <SearchPopup />}
            {user && (
              <NotificationBell
                key={unreadNotifications.map(notification => `${notification.kind}:${notification.id}`).join(',')}
                unreadNotifications={unreadNotifications}
              />
            )}
            {user && (
              <Link href="/messages" className="p-2 rounded-full text-banner-dark/60 hover:text-banner-dark hover:bg-banner-light/10 transition-all duration-200 relative group" title="Messages">
                <span className="sr-only">View messages</span>
                <EnvelopeIcon className="h-6 w-6 transform group-hover:scale-110 transition-transform" aria-hidden="true" focusable="false" />
              </Link>
            )}
            {user ? (
              <div className="flex items-center space-x-3 pl-2 md:pl-4 border-l border-banner-light/20">
                <div className="hidden sm:flex items-center space-x-3">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" width="36" height="36" className="h-9 w-9 rounded-full border-2 border-banner-light/30 object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-banner-light/20 flex items-center justify-center text-banner-dark font-bold border-2 border-banner-light/30">
                      {(profile?.full_name || user.email || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-banner-dark whitespace-nowrap">{profile?.full_name || user.email}</span>
                </div>
                <form action={signout} className="hidden sm:block">
                  <button type="submit" className="text-sm px-4 py-2 rounded-full bg-red-50 text-red-700 font-semibold hover:bg-red-100 hover:text-red-800 transition-colors duration-200">
                    Sign Out
                  </button>
                </form>
              </div>
            ) : (
              <Link href="/login" className="text-sm font-bold px-6 py-2.5 rounded-full bg-banner-dark text-white hover:bg-banner-dark/90 hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200">
                Sign In
              </Link>
            )}
            <MobileMenu userRole={profile?.role} isAuthenticated={Boolean(user)} />
          </div>
        </div>
      </div>
    </nav>
  )
}
