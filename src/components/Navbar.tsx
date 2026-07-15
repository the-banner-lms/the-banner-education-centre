import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { signout } from '@/app/login/actions'
import { getUserProfile } from '@/utils/supabase/queries'
import SearchPopup from './SearchPopup'
import NotificationBell from './NotificationBell'
import MobileMenu from './MobileMenu'
import NavigationLink from './NavigationLink'
import { EnvelopeIcon } from '@heroicons/react/24/outline'

type NavbarAnnouncement = {
  id: string
  title: string
  created_at: string
}

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const profile = await getUserProfile(supabase)

  let unreadAnnouncements: NavbarAnnouncement[] = [];

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
      
      unreadAnnouncements = relevantAnnouncements.filter(a => !readIds.has(a.id));
    }
  }

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-banner-light/20 sticky top-0 z-50 hide-in-pdf transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 md:h-24">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center space-x-3 text-2xl font-bold text-banner-dark group">
                <div className="relative overflow-hidden rounded-full bg-white shadow-sm border border-banner-light/20 p-1 group-hover:shadow-md transition-shadow duration-300">
                  <img src="/logo.png" alt="The Banner Education Centre Logo" className="h-12 w-12 md:h-16 md:w-16 object-contain transform group-hover:scale-105 transition-transform duration-500" />
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
                key={unreadAnnouncements.map(announcement => announcement.id).join(',')}
                unreadAnnouncements={unreadAnnouncements}
              />
            )}
            {user && (
              <Link href="/messages" className="p-2 rounded-full text-banner-dark/60 hover:text-banner-dark hover:bg-banner-light/10 transition-all duration-200 relative group" title="Messages">
                <span className="sr-only">View messages</span>
                <EnvelopeIcon className="h-6 w-6 transform group-hover:scale-110 transition-transform" aria-hidden="true" />
              </Link>
            )}
            {user ? (
              <div className="flex items-center space-x-3 pl-2 md:pl-4 border-l border-banner-light/20">
                <div className="hidden sm:flex items-center space-x-3">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="h-9 w-9 rounded-full border-2 border-banner-light/30 object-cover" referrerPolicy="no-referrer" />
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
