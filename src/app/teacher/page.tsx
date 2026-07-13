import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import RecentAnnouncementsInbox from '@/components/announcements/RecentAnnouncementsInbox'
import { isTeacher } from '@/utils/supabase/queries'

export const dynamic = 'force-dynamic'

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const access = await isTeacher(supabase)
  if (!access) {
    redirect('/dashboard') // Redirect non-teachers to the student dashboard or unauthorized page
  }

  const { getRecentAnnouncementsForRole } = await import('@/utils/supabase/announcements');
  const recentAnnouncements = await getRecentAnnouncementsForRole(supabase, 'teacher', 5);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-banner-dark">Teacher Dashboard</h1>
      <RecentAnnouncementsInbox announcements={recentAnnouncements || []} viewAllHref="/announcements" />

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <p className="text-gray-600 mb-4">Welcome to the Teacher Panel.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-blue-900 mb-2">My Classes</h3>
            <p className="text-sm text-blue-700">Manage your assigned classes and students.</p>
          </div>
          <div className="bg-green-50 p-6 rounded-xl border border-green-100 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-green-900 mb-2">Attendance</h3>
            <p className="text-sm text-green-700">Mark and review student attendance.</p>
          </div>
          <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-purple-900 mb-2">Performances</h3>
            <p className="text-sm text-purple-700">Update weekly performance reports.</p>
          </div>
        </div>
      </div>

    </div>
  )
}
