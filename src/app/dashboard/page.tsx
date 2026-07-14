import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import RecentAnnouncementsInbox from '@/components/announcements/RecentAnnouncementsInbox'
import StudentReportDownloadButton from '@/components/StudentReportDownloadButton'
import WeeklyAttendanceTracker, { AttendanceStatus } from '@/components/WeeklyAttendanceTracker'
import WeeklyPerformanceDisplay from '@/components/WeeklyPerformanceDisplay'
import { getRoleBadgeStyle } from '@/utils/theme'

export const dynamic = 'force-dynamic'

export default async function StudentDashboardPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch student profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return <div className="p-8 text-center text-red-500">Profile not found.</div>
  }

  // Ensure they have access to the student dashboard
  if (!['student', 'teacher', 'staff', 'admin'].includes(profile.role)) {
    return <div className="p-8 text-center text-red-500">Unauthorized. This dashboard is for students.</div>
  }

  const { data: performances } = await supabase
    .from('weekly_performances')
    .select('*')
    .eq('student_id', user.id)
    .order('week_start_date', { ascending: false })

  const { data: tuitionFees } = await supabase
    .from('monthly_tuition_fees')
    .select('*')
    .eq('student_id', user.id)
    .order('month_year', { ascending: false })

  const { getRecentAnnouncementsForRole } = await import('@/utils/supabase/announcements');
  const recentAnnouncements = await getRecentAnnouncementsForRole(supabase, 'student', 5);

  const getStartOfCurrentWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    return start.toISOString().split('T')[0];
  };

  const weekParam = typeof searchParams.week === 'string' ? searchParams.week : null;
  const weekStartDateStr = weekParam || getStartOfCurrentWeek();
  const weekStartDate = new Date(weekStartDateStr);

  const nextWeek = new Date(weekStartDate);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const prevWeek = new Date(weekStartDate);
  prevWeek.setDate(prevWeek.getDate() - 7);

  const nextWeekStr = nextWeek.toISOString().split('T')[0];
  const prevWeekStr = prevWeek.toISOString().split('T')[0];

  const endDate = new Date(weekStartDate);
  endDate.setDate(endDate.getDate() + 4); // Friday
  const weekEndDateStr = endDate.toISOString().split('T')[0];

  const { data: attendanceData } = await supabase
    .from('daily_attendance')
    .select('date, morning_status, afternoon_status')
    .eq('student_id', user.id)
    .gte('date', weekStartDateStr)
    .lte('date', weekEndDateStr);

  const attendanceRecords = (attendanceData || []).map(r => ({
    date: r.date,
    morning_status: r.morning_status as AttendanceStatus | null,
    afternoon_status: r.afternoon_status as AttendanceStatus | null
  }));

  const currentPerformances = performances?.filter(p => {
    return p.week_start_date >= weekStartDateStr && p.week_start_date <= weekEndDateStr;
  }) || [];

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8" id="dashboard-content">
      <div className="mb-8">
        <RecentAnnouncementsInbox announcements={recentAnnouncements || []} viewAllHref="/announcements" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 space-y-4 sm:space-y-0 bg-white p-6 rounded-lg shadow border border-gray-100">
        <div className="flex items-center space-x-6">
          <img 
            src={profile.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile.email || 'S')} 
            alt="Profile" 
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-indigo-50 shadow-md"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous" // Important for html2canvas to not taint canvas
          />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{profile.full_name || 'My Dashboard'}</h1>
            <p className="text-gray-500">{profile.email}</p>
            <p className={`inline-block mt-2 text-xs px-2 py-1 rounded-full font-semibold uppercase tracking-wide ${getRoleBadgeStyle(profile.role)}`}>
              {profile.role}
            </p>
          </div>
        </div>
        <div className="hide-in-pdf">
          <StudentReportDownloadButton studentId={user.id} weekStartDate={weekStartDateStr} />
        </div>
      </div>

      <WeeklyPerformanceDisplay 
        performances={currentPerformances}
        weekStartDate={weekStartDateStr}
        prevWeekUrl={`/dashboard?week=${prevWeekStr}`}
        nextWeekUrl={`/dashboard?week=${nextWeekStr}`}
      />
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Tuition Fees History</h2>
        {tuitionFees && tuitionFees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Updated At</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {tuitionFees.map(fee => (
                  <tr key={fee.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{fee.month_year}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${fee.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {fee.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{fee.remarks}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(fee.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No tuition fee records found.</p>
        )}
      </div>
      
      <div className="mt-8">
        <WeeklyAttendanceTracker 
          weekStartDate={weekStartDateStr}
          attendanceRecords={attendanceRecords}
          prevWeekUrl={`/dashboard?week=${prevWeekStr}`}
          nextWeekUrl={`/dashboard?week=${nextWeekStr}`}
        />
        <div className="mt-4 flex justify-end">
          <Link href="/dashboard/monthly-calendar" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 hide-in-pdf">
            View Monthly Calendar
          </Link>
        </div>
      </div>
      
      {/* Footer for PDF printout */}
      <div className="mt-8 text-center text-gray-400 text-xs hidden-in-browser show-only-in-pdf">
        <p>Generated by The Banner Education Centre • {new Date().toLocaleDateString()}</p>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .show-only-in-pdf { display: none; }
        @media print {
          .show-only-in-pdf { display: block; }
          .hide-in-pdf { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}} />
    </div>
  )
}
