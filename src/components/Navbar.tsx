import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { signout } from '@/app/login/actions'
import { getUserProfile } from '@/utils/supabase/queries'
import SearchPopup from './SearchPopup'
import NotificationBell from './NotificationBell'
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
      .in('target_role', profile.role === 'admin' ? ['all', 'admin', 'staff', 'teacher', 'student'] : ['all', profile.role])
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
    <nav className="bg-white border-b border-gray-200 hide-in-pdf">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-24">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center space-x-2 text-xl font-bold text-indigo-600">
                <img src="/logo.png" alt="The Banner Education Centre Logo" className="h-20 w-auto object-contain py-1" />
                <span>The Banner</span>
              </Link>
            </div>
            <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium">
                Home
              </Link>
              <Link href="/textbook" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium">
                Bookshelf
              </Link>
              <Link href="/blog" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium">
                Blog
              </Link>
              <Link href="/activities" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium">
                Activities
              </Link>
              <Link href="/forum" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium">
                Forum
              </Link>
              {user && profile?.role === 'student' && (
                  <Link href="/dashboard" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium">
                    Student Dashboard
                  </Link>
              )}
              {user && profile?.role === 'teacher' && (
                  <Link href="/teacher" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium">
                    Teacher Panel
                  </Link>
              )}
              {user && profile?.role === 'staff' && (
                  <Link href="/staff" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium">
                    Staff Panel
                  </Link>
              )}
              {user && profile?.role === 'admin' && (
                <Link href="/admin" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium">
                  Admin Panel
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user && <SearchPopup />}
            {user && (
              <NotificationBell
                key={unreadAnnouncements.map(announcement => announcement.id).join(',')}
                unreadAnnouncements={unreadAnnouncements}
              />
            )}
            {user && (
              <Link href="/messages" className="p-1 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors relative" title="Messages">
                <span className="sr-only">View messages</span>
                <EnvelopeIcon className="h-6 w-6" aria-hidden="true" />
              </Link>
            )}
            {user ? (
              <div className="flex items-center space-x-4">
                {profile?.avatar_url && (
                  <img src={profile.avatar_url} alt="Profile" className="h-8 w-8 rounded-full border border-gray-200" referrerPolicy="no-referrer" />
                )}
                <span className="text-sm text-gray-700">{profile?.full_name || user.email}</span>
                <form action={signout}>
                  <button type="submit" className="text-sm text-red-600 font-medium hover:text-red-500">
                    Sign Out
                  </button>
                </form>
              </div>
            ) : (
              <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
