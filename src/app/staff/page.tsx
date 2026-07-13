import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import RecentAnnouncementsInbox from '@/components/announcements/RecentAnnouncementsInbox'
import { isStaff } from '@/utils/supabase/queries'
import { getRecentAnnouncementsForRole } from '@/utils/supabase/announcements'

export const dynamic = 'force-dynamic'

export default async function StaffDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const access = await isStaff(supabase)
  if (!access) {
    redirect('/dashboard')
  }

  const recentAnnouncements = await getRecentAnnouncementsForRole(supabase, 'staff')

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-banner-dark">Staff Dashboard</h1>
      <RecentAnnouncementsInbox announcements={recentAnnouncements || []} viewAllHref="/announcements" />

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <p className="text-gray-600 mb-4">Welcome to the Staff Panel.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-teal-50 p-6 rounded-xl border border-teal-100 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-teal-900 mb-2">Student Records</h3>
            <p className="text-sm text-teal-700">View and manage student information.</p>
          </div>
          <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-orange-900 mb-2">Fees & Payments</h3>
            <p className="text-sm text-orange-700">Track and update monthly tuition fees.</p>
          </div>
          <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-indigo-900 mb-2">General Admin</h3>
            <p className="text-sm text-indigo-700">Access to daily school operations.</p>
          </div>
        </div>
      </div>

    </div>
  )
}
