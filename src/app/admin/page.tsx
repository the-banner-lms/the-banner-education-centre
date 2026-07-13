import { createClient } from '@/utils/supabase/server'
import RecentAnnouncementsInbox from '@/components/announcements/RecentAnnouncementsInbox'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Fetch counts by role
  const { count: adminCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin')
  const { count: staffCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'staff')
  const { count: teacherCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher')
  const { count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student')

  // Fetch content counts
  const { count: textbookCount } = await supabase.from('textbooks').select('*', { count: 'exact', head: true })
  const { count: blogCount } = await supabase.from('blog_posts').select('*', { count: 'exact', head: true })
  const { count: lessonCount } = await supabase.from('lessons').select('*', { count: 'exact', head: true })
  const { count: announcementCount } = await supabase.from('announcements').select('*', { count: 'exact', head: true })

  const { getRecentAnnouncementsForRole } = await import('@/utils/supabase/announcements');
  const recentAnnouncements = await getRecentAnnouncementsForRole(supabase, 'admin', 5);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Dashboard Overview</h1>

      <RecentAnnouncementsInbox announcements={recentAnnouncements || []} viewAllHref="/admin/announcements" />

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 inline-block mb-8">
        <h2 className="text-sm font-medium text-gray-500 mb-1">Total System Admins</h2>
        <p className="text-3xl font-semibold text-gray-900">{adminCount || 0}</p>
      </div>
      
      {/* Staff Actions Table */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[#0f6630] mb-3">Staff Activities (Total: {staffCount || 0})</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Textbooks Uploaded</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blog Posts Published</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Announcements Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{textbookCount || 0}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{blogCount || 0}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{announcementCount || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Teacher Actions Table */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[#0f6630] mb-3">Teacher Activities (Total: {teacherCount || 0})</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lessons Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Teachers</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{lessonCount || 0}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{teacherCount || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Actions Table */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[#0f6630] mb-3">Student Activities (Total: {studentCount || 0})</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered Students</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Enrollments</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{studentCount || 0}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">N/A</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

